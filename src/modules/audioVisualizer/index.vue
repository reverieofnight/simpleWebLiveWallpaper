<template>
  <div class="audio-visualizer-layer">
    <canvas id="circle-canvas"></canvas>
    <canvas id="bar-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, computed,ref, watch, nextTick } from 'vue';
import { useStore } from '@/pinia';
import emitter from '@/utils/mitt';
let audioArraySample = new Array(128).fill(0);
// import audioArraySample from '../../../samples/audioArraySample';
const store = useStore();
const fpsLimit = computed(() => store.fpsLimit);
const enableBar = computed(() => store.visSet.enableBar);
const enableCircle = computed(() => store.visSet.enableCircle);
const showFPS = computed(() => store.visSet.showFPS);
let initTimer = null;
let audioSimulatorTimer = '';
let resizeHandler = null;
let currentData = new Array(128).fill(0);
let expectData = new Array(128).fill(0);
const playing = ref(false);//是否正在播放
let stopReceive = false;
let fpsThresholdMin = 1 / fpsLimit.value;
let drawAniId = '';
let barAniId = '';
let circleAniId = '';
let isInit = false;
// 初始化
function init(){
  if(initTimer){
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(() => {
    initTimer = null;//清除定时器标识
    console.log('初始化音频可视化层');
    //清空正在播放的数据
    currentData.fill(0);
    //清空预期数据
    expectData.fill(0);
    playing.value = false;
    stopReceive = false;
    isInit = true;
    if(process.env.NODE_ENV === 'production'){
      window.wallpaperRegisterAudioListener(wallpaperAudioListener);
    } else if(process.env.NODE_ENV === 'development') {
      //模拟数据
      let i = 0;
      if(audioSimulatorTimer){
        clearInterval(audioSimulatorTimer);
      }
      audioSimulatorTimer = setInterval(() => {
        let arr = audioArraySample[i];
        wallpaperAudioListener(arr);
        i++;
        if(i >= audioArraySample.length){
          i = 0;
        }
      }, 33.3);
    }
    if(resizeHandler){
      emitter.off('windowResize', resizeHandler);
      resizeHandler = null;
    }
    resizeHandler = handleWindowResize;
    emitter.on('windowResize', resizeHandler);

  })
}
let barCanvas = '';
let circleCanvas = '';
let bctx = '';
let cctx = '';
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let interval = 2;
let barWidth = (windowWidth - (127 * interval)) / 128;
// 定义中心坐标
let centerX = windowWidth / 2;
let centerY = windowHeight / 2;
onMounted(() => {
  barCanvas = document.getElementById('bar-canvas');
  barCanvas.width = windowWidth;
  barCanvas.height = windowHeight;
  bctx = barCanvas.getContext('2d');
  circleCanvas = document.getElementById('circle-canvas');
  circleCanvas.width = windowWidth;
  circleCanvas.height = windowHeight;
  cctx = circleCanvas.getContext('2d');
})

function handleWindowResize(){
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  barCanvas.width = windowWidth;
  barCanvas.height = windowHeight;
  circleCanvas.width = windowWidth;
  circleCanvas.height = windowHeight;
  barWidth = (windowWidth - (127 * interval)) / 128;
  centerX = windowWidth / 2;
  centerY = windowHeight / 2;
}
watch(enableBar,(val) => {
  if(!barAniId && val && playing.value){
    if(!drawAniId){
      drawInit();
    }
    drawBarInit();
  }
  if(barAniId && !val){
    destroyBar();
  }
})
watch(enableCircle,(val) => {
  if(!circleAniId && val && playing.value){
    if(!drawAniId){
      drawInit();
    }
    drawCircleInit();
  }
  if(circleAniId && !val){
    destroyCircle();
  }
})
watch(fpsLimit,(val) => {
  fpsThresholdMin = 1 / val;
})
function wallpaperAudioListener(audioArray){
  if(stopReceive || !audioArray || audioArray.length === 0){
    return;
  }
  //如果音乐停止了，来音乐了，立即播放
  if(playing.value === false && audioArray.some(value => value !== 0)){
    playing.value = true;
    nextTick(() => {
      if(!drawAniId && (enableBar.value || enableCircle.value)){
        drawInit();
      }
      if(!barAniId && enableBar.value){
        drawBarInit();
      }
      if(!circleAniId && enableCircle.value){
        drawCircleInit();
      }
    })
    console.log('音乐开始播放');
  }
  if(playing.value === true){
    if(isInit){
      isInit = false;
      expectData = handlerAudioArray(audioArray);
    } else {
      //如果音乐停止了，则停止绘制
      if(currentData[0] === 0 && audioArray[0] === 0){
        // 判断是否真的停止了
        let reallyStop = currentData.every(value => value === 0) && audioArray.every(value => value === 0);
        if(reallyStop){
          playing.value = false;
          expectData.fill(0);
          console.log('音乐停止');
        } else {
          expectData = handlerAudioArray(audioArray);
        }
      } else {
        expectData = handlerAudioArray(audioArray);
      }
    }
  }
}
//处理音频数据
function handlerAudioArray(data){
  //合并左右声道
  let arr = [];
  for(let i = 0; i < 64;i++ ){
    arr.push(data[i]);
    arr.push(data[i+64]);
  }
  return arr;
}
function drawInit(){
  let last = '';
  let now = '';
  let fpsThreshold = 0;
  let fps = 0;
  let lastRenderTime = 0;
  let renderNum = 0;
  let refreshRate = 30;// 音频刷新率，即每秒产生多少次变化，wallpaper Engine 每秒发送30次频谱数据，所以这里设置为30最为合适。
  let dt = 0;// 帧时间差：记录相邻两帧之间的时间间隔，单位为秒，用于确保动画在不同帧率下表现一致
  drawAniId = requestAnimationFrame(draw);
  function draw(){
    if(!last){
      last = performance.now() / 1000;
      lastRenderTime = last;
    } else {
      now = performance.now() / 1000;
      dt = Math.min(now - last,1);
      last = now;
      if(fpsLimit.value > 0){
        fpsThreshold += dt;
        if(fpsThreshold < fpsThresholdMin){
          drawAniId = requestAnimationFrame(draw);
          return;
        }
        fpsThreshold -= fpsThresholdMin;
        if(showFPS.value){
          renderNum++;
          if(now - lastRenderTime > 1){
            fps = renderNum;
            renderNum = 0;
            lastRenderTime = now;
          }
        } 
      }
    }
    for(let i = 0; i < currentData.length;i++){
      let expect = expectData[i];
      let current = currentData[i];
      let dh = expect - current;
      let step = dh * refreshRate / fpsLimit.value;
      if(Math.abs(step) >= Math.abs(dh)){
        step = dh;
      }
      let nextData = current + step;
      if(nextData < 0.001){
        nextData = 0;
      }
      currentData[i] = nextData;
    }
    if(enableBar.value || enableCircle.value){
      if(playing.value || !currentData.every(value => value === 0)){
        drawAniId = requestAnimationFrame(draw);
      } else {
        drawAniId = '';
      }
    } else {
      drawAniId = '';
    }
  }
}
// 绘制条形可视化层
function drawBarInit(){
  console.log('开始绘制条形可视化');
  let last = '';
  let now = '';
  let fpsThreshold = 0;
  let fps = 0;
  let lastRenderTime = 0;
  let renderNum = 0;
  let dt = 0;// 帧时间差：记录相邻两帧之间的时间间隔,与屏幕刷新率有关，与fps限制无关
  barAniId = requestAnimationFrame(drawBars);
  function drawBars(){
    if(!last){
      last = performance.now() / 1000;
      lastRenderTime = last;
    } else {
      now = performance.now() / 1000;
      dt = Math.min(now - last,1);
      last = now;
      if(fpsLimit.value > 0){
        fpsThreshold += dt;
        if(fpsThreshold < fpsThresholdMin){
          barAniId = requestAnimationFrame(drawBars);
          return;
        }
        fpsThreshold -= fpsThresholdMin;
        if(showFPS.value){
          renderNum++;
          if(now - lastRenderTime > 1){
            fps = renderNum;
            renderNum = 0;
            lastRenderTime = now;
          }
        } 
      }
    }
    bctx.clearRect(0,0,windowWidth,windowHeight);
    if(showFPS.value){
      bctx.font = '20px Arial';
      bctx.fillText(`FPS:${fps}`,100,100);
    }
    // 绘制条形音频bars
    // 设置阴影属性
    bctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // 阴影颜色
    bctx.shadowBlur = 5; // 阴影模糊程度
    bctx.shadowOffsetX = 2; // 阴影水平偏移量
    bctx.shadowOffsetY = 2; // 阴影垂直偏移量
    bctx.fillStyle = 'rgba(255,255,255,0.7)';
    for(let i = 0; i < currentData.length;i++){
      let height = Math.min((windowHeight / 2) * currentData[i],windowHeight);
      let x = (barWidth + interval) * i;
      let y = windowHeight - height;
      bctx.fillRect(x, y + barWidth / 2, barWidth, height - barWidth / 2);
    }
    if(playing.value && enableBar.value){
      barAniId = requestAnimationFrame(drawBars);
    } else {
      barAniId = '';
      bctx.clearRect(0,0,windowWidth,windowHeight);
    }
  }
}
// 绘制圆形音频bars
function drawCircleInit(){
  console.log('开始绘制圆形可视化');
  let last = '';
  let now = '';
  let fpsThreshold = 0;
  let fps = 0;
  let lastRenderTime = 0;
  let renderNum = 0;
  let dt = 0;// 帧时间差：记录相邻两帧之间的时间间隔，单位为秒，用于确保动画在不同帧率下表现一致
  //定义透明度变量，初始值为 0
  let alpha = 0;
  let isAllZero = false;
  //定义透明度变化速度
  const alphaDecreaseSpeed = 0.5;
  // 定义基础半径
  const baseRadius = windowHeight / 4; // 固定基础半径为 500px
  //条形数量
  const barCount = currentData.length;
  // 定义角度步长
  const angleStep = (2 * Math.PI) / barCount;
  const cosCache = new Array(barCount); // 预计算 cos 值
  const sinCache = new Array(barCount); // 预计算 sin
  // 预计算 cos 和 sin 值
  for (let i = 0; i < barCount; i++) {
    cosCache[i] = Math.cos(angleStep * i); // 预计算 cos 值
    sinCache[i] = Math.sin(angleStep * i); // 预计算 sin 值
  }
  circleAniId = requestAnimationFrame(drawCircle);
  function drawCircle(){
    if(!last){
      last = performance.now() / 1000;
      lastRenderTime = last;
    } else {
      now = performance.now() / 1000;
      dt = Math.min(now - last,1);
      last = now;
      if(fpsLimit.value > 0){
        fpsThreshold += dt;
        if(fpsThreshold < fpsThresholdMin){
          circleAniId = requestAnimationFrame(drawCircle);
          return;
        }
        fpsThreshold -= fpsThresholdMin;
        if(showFPS.value){
          renderNum++;
          if(now - lastRenderTime > 1){
            fps = renderNum;
            renderNum = 0;
            lastRenderTime = now;
          }
        } 
      }
    }
    // 绘制圆形音频bars
    // 设置线条样式，应用透明度
    cctx.clearRect(0,0,windowWidth,windowHeight);
    cctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
    cctx.lineWidth = 3;
    cctx.shadowColor = `rgba(0, 0, 0, ${alpha * 0.5})`;
    cctx.shadowBlur = 5;
    cctx.shadowOffsetX = 2;
    cctx.shadowOffsetY = 2;
    cctx.beginPath();// 开始绘制路径
    for (let i = 0; i < barCount; i++) {
      // 增大音频数据对半径偏移量的影响，增强反应强度
      const offset = currentData[i] * 150;
      const radius = baseRadius + offset;
      const x = centerX + radius * cosCache[i];
      const y = centerY + radius * sinCache[i];
      if (i === 0) {
        cctx.moveTo(x, y);
      } else {
        cctx.lineTo(x, y);
      }
    }
    // 闭合路径
    cctx.closePath();
    cctx.stroke();// 绘制路径
    if(!playing.value){
      // 检查 currentData 是否全部为 0
      isAllZero = currentData.every(value => value === 0);
    } else if(isAllZero){
      isAllZero = false;
    }
    if (isAllZero && alpha > 0 && !playing.value) {
      // playing.value = false; // 设置播放状态为 false
      // 逐渐降低透明度
      alpha = Math.max(alpha - alphaDecreaseSpeed / fpsLimit.value, 0);
    } else if(alpha < 1 && playing.value) {
      // 有声音时恢复透明度
      alpha = Math.min(alpha + alphaDecreaseSpeed / fpsLimit.value, 1);
    }
    if(playing.value || (enableCircle.value && alpha > 0)){
      circleAniId = requestAnimationFrame(drawCircle);
    } else {
      circleAniId = '';
      cctx.clearRect(0,0,windowWidth,windowHeight);
    }
  }
}

function destroy(){
  console.log('销毁音频可视化层');
  stopReceive = true;
  // 清除未执行的定时器
  if(initTimer){
    clearTimeout(initTimer);
  }
  if(audioSimulatorTimer){
    clearInterval(audioSimulatorTimer);
  }
  if(drawAniId){
    cancelAnimationFrame(drawAniId);
    drawAniId = '';
  }
  // 取消绘制音频bars动画
  destroyBar();
  // 取消绘制圆形音频bars动画
  destroyCircle();
  //取消订阅事件
  if(resizeHandler){
    emitter.off('windowResize', resizeHandler);
    resizeHandler = null;
  }
}
// 取消绘制音频bars动画
function destroyBar(){
  console.log('销毁条形音频可视化层');
  // 取消绘制音频bars动画
  if(barAniId){
    cancelAnimationFrame(barAniId);
    barAniId = '';
    bctx.clearRect(0,0,windowWidth,windowHeight);
  }
}
// 取消绘制圆形音频bars动画
function destroyCircle(){
  console.log('销毁圆形音频可视化层');
  
  // 取消绘制圆形音频bars动画
  if(circleAniId){
    cancelAnimationFrame(circleAniId);
    circleAniId = '';
    cctx.clearRect(0,0,windowWidth,windowHeight);
  }
}
defineExpose({
  init,
  destroy
})
</script>

<style lang="less" scoped>
#bar-canvas{
  position: absolute;
  z-index: 1;
}
#circle-canvas{
  position: absolute;
  z-index: 2;
}
</style>