<template>
  <div class="audio-visualizer-layer">
    <canvas id="audio-visualizer-canvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useStore } from '@/pinia';
import emitter from '@/utils/mitt';
// let audioArraySample = [];
// for(let i = 0; i < 128;i++){
//   audioArraySample.push(0);
// }
import audioArraySample from '../../../samples/audioArraySample';
const store = useStore();
const fpsLimit = computed(() => store.fpsLimit);
let initTimer = "";
let currentData = [];
let expectData = [];
let playing = false;
let stopReceive = false;
function init(){
  if(initTimer){
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(() => {
    console.log('初始化音频可视化层');
    //清空正在播放的数据
    currentData.length = 0;
    //清空预期数据
    expectData.length = 0;
    for(let i = 0;i < 128;i++){
      currentData.push(0);
    }
    playing = false;
    stopReceive = false;
    if(process.env.NODE_ENV === 'production'){
      window.wallpaperRegisterAudioListener(wallpaperAudioListener);
    } else if(process.env.NODE_ENV === 'development') {
      //模拟数据
      let i = 0;
      setInterval(() => {
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
onMounted(() => {
  visCanvas = document.getElementById('audio-visualizer-canvas');
  visCanvas.width = window.innerWidth;
  visCanvas.height = window.innerHeight;
  ctx = visCanvas.getContext('2d');
  emitter.on('windowResize', () => {
    visCanvas.width = window.innerWidth;
    visCanvas.height = window.innerHeight;
    barWidth = (window.innerWidth - (127 * interval)) / 128;
  })
})
let cacheTime = 33.3;//缓冲时间 毫秒
let last = 0;
function wallpaperAudioListener(audioArray){
  if(stopReceive){
    return;
  }
  if(!last){
    last = performance.now();
    expectData = handlerAudioArray(audioArray);
  }
  if(currentData.length === 0){
    currentData = audioArray;
  }
  //如果音乐停止了，来音乐了，立即播放
  if(playing === false && audioArray[0] !== 0){
    playing = true;
    requestAnimationFrame(drawBars);
    console.log('音乐开始播放');
  }
  if(playing === true){
    //如果音乐停止了，则停止绘制
    if(currentData[0] === 0 && audioArray[0] === 0){
      let reallyStop = true;
      for(let i = 0; i< 128;i++){
        if(currentData[i] !== 0 || audioArray[0] !== 0){
          reallyStop = false;
        }
      }
      if(reallyStop === true){
        playing = false;
        console.log('音乐停止');
      } 
    }
    let now = performance.now();
    let dt = now - last;
    if(dt >= cacheTime){
      last = now;
      expectData = handlerAudioArray(audioArray);
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
//绘制音频bars
let last2 = '';
let fpsThreshold = 0;
let interval = 2;
let barWidth = (window.innerWidth - (127 * interval)) / 128;
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
      let step = dh * 30 / fpsLimit.value;
      currentData[index] = Math.max(current + step,0);
    })
  }
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    currentData.forEach((e,i) => {
      let height = Math.min((window.innerHeight / 2) * e,window.innerHeight);
      ctx.fillRect((barWidth + interval) * i,window.innerHeight - height,barWidth,height)
    })
  if(playing){
    requestAnimationFrame(drawBars)
  }
}
function destroy(){
  console.log('销毁音频可视化层');
  stopReceive = true;
  let arr = [];
  for(let i = 0; i < 128;i++){
    arr.push(0)
  }
  expectData = arr;
  requestAnimationFrame(drawBars);
}
defineExpose({
  init,
  destroy
})
</script>

<style lang="less" scoped>

</style>