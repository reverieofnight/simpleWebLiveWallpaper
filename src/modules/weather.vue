<template>
  <div class="weather-layer">
    <div class="weather-widget" :style="{opacity:lives.adcode ? 1 : 0}">
      <div class="top">
        <div class="weather">
          <svg-icon :name="lives.weather && weatherToIcon(lives.weather)" width="50" height="50"></svg-icon>
          <span>{{ lives.weather }}</span>
        </div>
        <div class="right">
          <div class="temperature">{{ lives.temperature }}℃</div>
          <div class="humidity">
            <svg-icon :name="calcComfort(lives.humidity)" width="30" height="30"></svg-icon>
            <span>{{ lives.humidity }}%</span>
           </div>
        </div>
      </div>
      <div class="city">{{ lives.city }}</div>
    </div>
    <canvas id="rain-canvas" ref="rainCanvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import axios from 'axios';
import { weatherToIcon, weatherMerge } from './weatherToIcon';
import { storeToRefs } from 'pinia';
import { useStore } from '@/pinia';
import { nextTick } from 'process';
const store = useStore();
const { weatherSet } = storeToRefs(store);
const cityCode = computed(() => {
  return weatherSet.value.cityCode
})
let lives = reactive({
  province:'',
  city:'',
  adcode:'',
  weather:'',
  temperature:'',
  winddirection:'',
  windpower:'',
  humidity:'',
  reporttime:'',
  temperature_float:'',
  humidity_float:'',
})
let timer = '';
const refreshInterval = 10 * 60 * 1000;
let rainTimer = '';
function init(){
  console.log('天气层初始化');
  getWeather();
  if(timer){
    clearInterval(timer);
  }
  timer = setInterval(() => {
    getWeather();
  },refreshInterval)
}
function waitCityCode(){
  return new Promise((resolve, reject) => {
    if(!cityCode.value){
      let timer = setInterval(() => {
        if(cityCode.value){
          clearInterval(timer);
          resolve();
        }
      },100)
      setTimeout(() => {
        if(!cityCode.value){
          clearInterval(timer);
          reject('未获得城市编码!')
        }
      }, 5000);
    } else {
      resolve();
    }
  })
}
function getWeather(){
  // let city = '320281';//江阴市
  waitCityCode().then(() => {
    let city = cityCode.value;
    let apiKey = 'c7fee6c6ae63763b4d8529c9a8589c83';
    let data = {
      key:apiKey,
      city:city,
      extensions:'base'
    }
    axios({
      url:'https://restapi.amap.com/v3/weather/weatherInfo',
      method:'get',
      params:data
    }).then((res) => {
      if(res.status === 200 && res.data && res.data.lives && res.data.lives[0]){
        Object.assign(lives,res.data.lives[0])
        console.log('实时天气',lives);
        if(lives.weather){
          let weather = weatherMerge(lives.weather);
          if(['雨','雨夹雪'].includes(weather)){
            //开启下雨效果
            initRain();
          } else {
            if(rainTimer){
              stopRain();
            }
          }
        }
      }
    })
    .catch((err) => {
      console.log('err',err);
    })
  })
}
function calcComfort(humidity){
  if(humidity >= 40 && humidity <= 70){
    return 'smile'
  } else {
    return 'cry'
  }
}
//下雨效果实现
let rainCanvas = '';
let ctx = '';
const rainArr = [];
onMounted(() => {
  rainCanvas = document.getElementById('rain-canvas');
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  ctx = rainCanvas.getContext('2d');
  console.log('ctx',ctx);
  window.onresize = () => {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
  }
})

function initRain(){
  genRain();
  if(rainTimer){
    clearInterval(rainTimer);
  }
  rainTimer = setInterval(() => {
    genRain();
  },50)
}
function stopRain(){
  if(rainTimer){
    clearInterval(rainTimer);
  }
}
function genRain(){
  let x = Math.random() * window.innerWidth;
  let y = -100;
  let height = Math.random()*40 + 10;
  let width = height / 50;
  let speed = height / 3;
  let opacity = height / 50;
  let rain = {
    x,
    y,
    width,
    height,
    speed,
    opacity,
  }
  rainArr.push(rain);
  //如果绘画已经停止，重新启动绘画
  if(rainArr.length === 1){
    requestAnimationFrame(drawRain);
    // drawRain();
  }
  //绘制雨滴将落的效果
  function drawRain(){
    ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    rainArr.forEach((e,index) => {
      ctx.fillStyle = 'rgb(255,255,255,' + e.opacity + ')';
      ctx.fillRect(e.x,e.y,e.width,e.height);
      e.y = e.y + e.speed;
      if(e.y > window.innerHeight){
        rainArr.splice(index,1);
      }
    })
    if(rainArr.length > 0){
      requestAnimationFrame(drawRain);
    } else {
      ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
    }
  }
}

function destroy(){
  //清除定时器
  if(timer){
    clearInterval(timer);
  }
  //清除下雨定时器
  if(rainTimer){
    clearInterval(rainTimer)
  }
  //隐藏天气层
  if(lives.adcode){
    lives.adcode = '';
    setTimeout(() => {
      //清除数据
      for(let key in lives){
        lives[key] = '';
      }
    }, 1000);
  }
  
}
defineExpose({
  init,
  destroy
})
</script>

<style lang="less" scoped>
.weather-layer{
  width: 100%;
  height:100%;
  .weather-widget{
    position: absolute;
    right:5%;
    top:10%;
    color:white;
    text-shadow: 0 0 5px rgba(0,0,0,0.7);
    font-size: 20px;
    border-radius: 10px;
    width:180px;
    height:140px;
    font-family: 'Microsoft YaHei','SimHei';
    // background-color: rgba(255,255,255,0.3);
    // border:1px solid #ddd;
    // backdrop-filter: blur(10px);
    // cursor: pointer;
    // user-select:none;
    transition: opacity 1s ease;
    .top{
      display: flex;
      height:90px;
      .weather{
        width:40%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .right{
        width:60%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        .temperature{
          font-size: 40px;
        }
        .humidity{
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-evenly;
        }
      }
    }
    .city{
      text-align: center;
      font-size: 30px;
    }
    svg{
      filter: drop-shadow(0 0 3px rgba(0,0,0,0.4));
    }
  }
  #rain-canvas{
    position: absolute;
  }
}


</style>