<template>
  <div class="audio-visualizer-layer">
    <canvas id="audio-visualizer-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, computed,ref } from 'vue';
import { useStore } from '@/pinia';
import emitter from '@/utils/mitt';
let audioArraySample = [];
for(let i = 0; i < 128;i++){
  audioArraySample.push(0);
}
// import audioArraySample from '../../../samples/audioArraySample';
const store = useStore();
const fpsLimit = computed(() => store.fpsLimit);
let initTimer = null;
let audioSimulatorTimer = '';
let currentData = [];
let expectData = [];
const playing = ref(false);
let stopReceive = false;
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
let visCanvas = '';
let ctx = '';
let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
onMounted(() => {
  visCanvas = document.getElementById('audio-visualizer-canvas');
  visCanvas.width = windowWidth;
  visCanvas.height = windowHeight;
  ctx = visCanvas.getContext('2d');
  emitter.on('windowResize', handleWindowResize);
})

function handleWindowResize(){
  windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    visCanvas.width = windowWidth;
    visCanvas.height = windowHeight;
    barWidth = (windowWidth - (127 * interval)) / 128;
}
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
    requestAnimationFrame(drawBars);
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
//绘制音频bars
let last2 = '';
let fpsThreshold = 0;
let interval = 2;
let barWidth = (windowWidth - (127 * interval)) / 128;
function drawBars(){
  if(!last2){
    last2 = performance.now() / 1000;
  } else {
    let now = performance.now() / 1000;
    let dt = Math.min(now - last2,1);
    last2 = now;
    if(fpsLimit.value > 0){
      fpsThreshold += dt;
      if(fpsThreshold < 1.0 / fpsLimit.value){
        requestAnimationFrame(drawBars);
        return;
      }
      fpsThreshold -= 1.0 / fpsLimit.value;
    }
  }
  if(currentData.length > 0 && expectData.length > 0){
    currentData.forEach((e,index) =>{
      let expect = expectData[index];
      let current = currentData[index];
      let dh = expect - current;
      let step = dh * 33.3 / fpsLimit.value;
      if(Math.abs(step) >= Math.abs(dh)){
        step = dh;
      }
      let nextData = current + step;
      if(nextData < 0.001){
        nextData = 0;
      }
      currentData[index] = nextData;
    })
  }
  ctx.clearRect(0,0,windowWidth,windowHeight);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  currentData.forEach((e,i) => {
    let height = Math.min((windowHeight / 2) * e,windowHeight);
    ctx.fillRect((barWidth + interval) * i,windowHeight - height,barWidth,height)
  })
  // 检查 currentData 是否全部为 0
  let isAllZero = currentData.every(value => value === 0) && expectData.every(value => value === 0);
  if (isAllZero) {
    playing.value = false; // 设置播放状态为 false
  }
  if(playing.value){
    requestAnimationFrame(drawBars)
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