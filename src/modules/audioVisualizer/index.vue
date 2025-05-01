<template>
  <div class="audio-visualizer-layer">
    <canvas id="bar-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, computed,ref, watch } from 'vue';
import { useStore } from '@/pinia';
import emitter from '@/utils/mitt';
import { nextTick } from 'process';
let audioArraySample = [];
for(let i = 0; i < 128;i++){
  audioArraySample.push(0);
}
// import audioArraySample from '../../../samples/audioArraySample';
const store = useStore();
const fpsLimit = computed(() => store.fpsLimit);
const enableBar = computed(() => store.visSet.enableBar);
const enableCircle = computed(() => store.visSet.enableCircle);
const showFPS = computed(() => store.visSet.showFPS);
let initTimer = null;
let audioSimulatorTimer = '';
let currentData = [];
let expectData = [];
const playing = ref(false);
let stopReceive = false;
let fpsThresholdMin = 1 / fpsLimit.value;
function init(){
  if(initTimer){
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(() => {
    initTimer = null;//清除定时器标识
    console.log('初始化音频可视化层');
    //清空正在播放的数据
    currentData.length = 0;
    //清空预期数据
    expectData.length = 0;
    for(let i = 0;i < 128;i++){
      currentData.push(0);
    }
    playing.value = false;
    stopReceive = false;
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
  })
}
let barCanvas = '';
let ctx = '';
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
onMounted(() => {
  barCanvas = document.getElementById('bar-canvas');
  barCanvas.width = windowWidth;
  barCanvas.height = windowHeight;
  ctx = barCanvas.getContext('2d');
  emitter.on('windowResize', handleWindowResize);
})

function handleWindowResize(){
  windowWidth = window.innerWidth;
  windowHeight = window.innerHeight;
  barCanvas.width = windowWidth;
  barCanvas.height = windowHeight;
  barWidth = (windowWidth - (127 * interval)) / 128;
}
watch(enableBar,(val) => {
  if(val === false && enableCircle.value === false){
    destroy();
  } else {
    init();
  }
})
watch(enableCircle,(val) => {
  if(val === false && enableBar.value === false){
    destroy();
  } else {
    init();
  }
})
watch(fpsLimit,(val) => {
  fpsThresholdMin = 1 / val;
})
function wallpaperAudioListener(audioArray){
  if(stopReceive){
    return;
  }
  if(expectData.length === 0){
    expectData = handlerAudioArray(audioArray);
  }
  if(currentData.length === 0){
    currentData = new Array(128).fill(0);
  }
  //如果音乐停止了，来音乐了，立即播放
  if(playing.value === false && audioArray.some(value => value !== 0)){
    playing.value = true;
    nextTick(() => {
      drawInit(); 
    })
    console.log('音乐开始播放');
  }
  if(playing.value === true){
    //如果音乐停止了，则停止绘制
    if(currentData[0] === 0 && audioArray[0] === 0){
      // 判断是否真的停止了
      let reallyStop = currentData.every(value => value === 0) && audioArray.every(value => value === 0);
      if(reallyStop){
        playing.value = false;
        console.log('音乐停止');
      } 
    }
    expectData = handlerAudioArray(audioArray);
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
let interval = 2;
let barWidth = (windowWidth - (127 * interval)) / 128;
function drawInit(){
  // 如果没有开启条形图和圆形图，直接返回
  if(!enableBar.value && !enableCircle.value){
    return; 
  }
  console.log('开始绘制');
  let last = '';
  let now = '';
  let fpsThreshold = 0;
  let fps = 0;
  let lastRenderTime = 0;
  let renderNum = 0;
  let transitionSpeed = 33.3;//反应速度 越高反应越快，抖动越厉害，越低，越平滑，但是反应也就越慢
  let dt = 0;// 帧时间差：记录相邻两帧之间的时间间隔，单位为秒，用于确保动画在不同帧率下表现一致

  // 定义旋转角度变量，初始值为 0
  let rotationAngle = 0;
  // 定义旋转速度，单位：弧度/秒
  const rotationSpeed = Math.PI / 8;
  // 定义色相值，初始值为 0
  let hue = 0;
  // 定义色相变化速度，单位：度/秒
  const hueChangeSpeed = 10;
  //定义透明度变量，初始值为 1
  let alpha = 1;
  //定义透明度变化速度
  const alphaDecreaseSpeed = 0.5;
  // 定义中心坐标
  const centerX = windowWidth / 2;
  const centerY = windowHeight / 2;
  // 定义基础半径
  const baseRadius = windowHeight / 4; // 固定基础半径为 500px
  //条形数量
  const barCount = currentData.length;
  // 定义角度步长
  const angleStep = (2 * Math.PI) / barCount;
  const cosCache = new Array(barCount); // 预计算 cos 值
  const sinCache = new Array(barCount); // 预计算 sin 
  if(enableCircle.value){
    // 预计算 cos 和 sin 值
    for (let i = 0; i < barCount; i++) {
      cosCache[i] = Math.cos(angleStep * i); // 预计算 cos 值
      sinCache[i] = Math.sin(angleStep * i); // 预计算 sin 值
    } 
  }
  requestAnimationFrame(drawBars);
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
          requestAnimationFrame(drawBars);
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
    if(currentData.length > 0 && expectData.length > 0){
      for(let i = 0; i < currentData.length;i++){
        let expect = expectData[i];
        let current = currentData[i];
        let dh = expect - current;
        // 使用dt计算步长，确保动画在不同帧率下表现一致
        let step = dh * transitionSpeed * dt;
        if(Math.abs(step) >= Math.abs(dh)){
          step = dh;
        }
        let nextData = current + step;
        if(nextData < 0.001){
          nextData = 0;
        }
        currentData[i] = nextData;
      }
    }
    ctx.clearRect(0,0,windowWidth,windowHeight);
    if(showFPS.value){
      ctx.font = '20px Arial';
      ctx.fillText(`FPS:${fps}`,100,100);
    }
    
    if(enableBar.value){
      // 绘制条形音频bars
      // 设置阴影属性
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'; // 阴影颜色
      ctx.shadowBlur = 5; // 阴影模糊程度
      ctx.shadowOffsetX = 2; // 阴影水平偏移量
      ctx.shadowOffsetY = 2; // 阴影垂直偏移量
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      for(let i = 0; i < currentData.length;i++){
        let height = Math.min((windowHeight / 2) * currentData[i],windowHeight);
        let x = (barWidth + interval) * i;
        let y = windowHeight - height;
        ctx.fillRect(x, y + barWidth / 2, barWidth, height - barWidth / 2);
      }
    }
    
    if(enableCircle.value){
      // 绘制圆形音频bars
      // 根据时间差更新旋转角度
      // rotationAngle += rotationSpeed * dt;
      // 确保角度在 0 到 2π 之间
      // rotationAngle %= 2 * Math.PI;
      // 根据时间差更新色相值
      hue += hueChangeSpeed * dt;
      // 确保色相值在 0 到 360 之间
      hue %= 360;
      // 设置线条样式，应用透明度
      ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.7})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = `rgba(0, 0, 0, ${alpha * 0.5})`;
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      // ctx.save(); // 保存当前画布状态
      // ctx.rotate(rotationAngle); // 旋转画布
      ctx.beginPath();// 开始绘制路径
      for (let i = 0; i < barCount; i++) {
        const angle = i * angleStep;
        // 增大音频数据对半径偏移量的影响，增强反应强度
        const offset = currentData[i] * 150;
        const radius = baseRadius + offset;
        const x = centerX + radius * cosCache[i];
        const y = centerY + radius * sinCache[i];

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      // 闭合路径
      ctx.closePath();
      // 设置填充颜色，使用 hsl 颜色模式，应用透明度
      // ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha * 0.3})`;
      // ctx.fill(); // 填充路径
      ctx.stroke();// 绘制路径
      // ctx.restore(); // 恢复之前保存的画布状态
    }
    
    // 检查 currentData 是否全部为 0
    let isAllZero = currentData.every(value => value === 0) && expectData.every(value => value === 0);
    if (isAllZero) {
      playing.value = false; // 设置播放状态为 false
      if(enableCircle.value){
        // 逐渐降低透明度
        alpha = Math.max(alpha - alphaDecreaseSpeed * dt, 0);
      }
    } else {
      if(enableCircle.value){
        // 有声音时恢复透明度
        alpha = Math.min(alpha + alphaDecreaseSpeed * dt, 1);
      }
    }
    if(playing.value || (enableCircle.value && alpha > 0)){
      requestAnimationFrame(drawBars)
    } else {
      ctx.clearRect(0,0,windowWidth,windowHeight);
    }
  }
}

function destroy(){
  console.log('销毁音频可视化层');
  stopReceive = true;
  // 清空预期数据，让 currentData 逐渐降为 0
  expectData = new Array(128).fill(0);
  // 清除未执行的定时器
  if(initTimer){
    clearTimeout(initTimer);
  }
  if(audioSimulatorTimer){
    clearInterval(audioSimulatorTimer);
  }
  //取消订阅事件
  emitter.off('windowResize', handleWindowResize);
  
}
defineExpose({
  init,
  destroy
})
</script>

<style lang="less" scoped>

</style>