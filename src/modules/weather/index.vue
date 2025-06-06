<template>
  <div class="weather-layer">
    <div class="weather-widget" :style="{opacity:lives.adcode ? 1 : 0}">
      <div class="top">
        <div class="weather">
          <svg-icon :name="lives.weather ? weatherToIcon(lives.weather):''" width="50" height="50"></svg-icon>
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
      <div class="message" :style="{opacity:message.opacity}">{{ message.value }}</div>
    </div>
    <canvas id="rain-canvas" ref="rainCanvas"></canvas>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue';
import axios from 'axios';
import { weatherToIcon, weatherMerge, weatherMergeList } from './weatherToIcon';
import { useStore } from '@/pinia';
import dayjs from 'dayjs';
import emitter from '@/utils/mitt';
import adCodeMap from "@/assets/adCodeMap";
const store = useStore();
const cityCode = computed(() => store.weatherSet.cityCode)
const apiKey = computed(() => store.weatherSet.apiKey)
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
const message = reactive({
  value:'天气数据已更新',
  opacity:0,
})
//初始化防抖定时器
let initTimer = '';
function init(){
  if(initTimer){
    clearTimeout(initTimer);
  }
  initTimer = setTimeout(() => {
    console.log('初始化天气层');
    if(!apiKey.value){
      return;
    }
    getWeather();
    if(timer){
      clearInterval(timer);
    }
    timer = setInterval(() => {
      getWeather();
    },refreshInterval)
  }, 100);
}
function getWeather(){
  waitCityCode().then(() => {
    let city = cityCode.value;
    let key = apiKey.value;
    let data = {
      key:key,
      city:city,
      extensions:'base'
    }
    axios({
      url:'https://restapi.amap.com/v3/weather/weatherInfo',
      method:'get',
      params:data
    }).then((res) => {
      if(res.status === 200 && res.data && res.data.lives && res.data.lives[0]){
        let data = res.data.lives[0];
        console.log('实时天气',data);
        setWeatherData(data);
        localStorage.setItem('lives',JSON.stringify(data));
      }
    })
    .catch((err) => {
      console.log('err',err);
      getOfflineWeather();
    })
    .finally(() => {
      
    })
  })
  .catch((err) => {
    console.log(err);
  })
}
function waitCityCode(){
  return new Promise((resolve, reject) => {
    if(!cityCode.value){
      //尝试ip定位
      let data = {
        key:apiKey.value
      }
      axios({
        url:'https://restapi.amap.com/v3/ip',
        method:'get',
        params:data
      })
      .then((res) => {
        if(res.status === 200 && res.data.adcode){
          console.log('ip定位结果',res.data);
          store.weatherSet.cityCode = adCodeMap[res.data.city];
          resolve();
        }
      })
      .catch((err) => {
        getOfflineWeather();
        reject('ip定位失败');
      })
    } else {
      resolve();
    }
  })
}
//获取离线数据
function getOfflineWeather(){
  let tempLives = JSON.parse(localStorage.getItem('lives'))
  if(tempLives && tempLives.reporttime){
    let now = dayjs().valueOf();
    let old = dayjs(tempLives.reporttime).valueOf();
    let dt = now - old;
    if(dt <= 1 * 60 * 60 * 1000){
      setWeatherData(tempLives);
      console.log('离线天气',tempLives);
    } else {
      console.log('离线天气数据过时');
    }
  }
}
//设置天气并且判断是否开启特效
let raining = false;//是否正在下雨
function setWeatherData(data){
  Object.assign(lives,data);
  showMessage();
  if(lives.weather){
    // lives.weather = '中雨';
    let weather = weatherMerge(lives.weather);
    if(['雨','雨夹雪'].includes(weather)){
      //开启下雨效果
      initRain();
    } else {
      if(raining){
        stopRain();
      }
    }
  }
  //显示天气数据更新提示
  function showMessage(){
    message.opacity = 1;
    setTimeout(() => {
      message.opacity = 0;
    },5000)
  }
}
//计算是否舒适
function calcComfort(humidity){
  if(humidity >= 40 && humidity <= 70){
    return 'smile'
  } else {
    return 'cry'
  }
}
//下雨效果实现
let rainCanvas = '';
let ctx = ''
const rainArr = [];
const fpsLimit = computed(() => store.fpsLimit);
onMounted(() => {
  rainCanvas = document.getElementById('rain-canvas')
  rainCanvas.width = window.innerWidth;
  rainCanvas.height = window.innerHeight;
  ctx = rainCanvas.getContext('2d');
  emitter.on('windowResize', () => {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
  })
})
let rainTimer = '';
function initRain(){
  raining = true;
  if(rainTimer){
    clearTimeout(rainTimer);
  }
  genRain();
}
function stopRain(){
  raining = false;
  if(rainTimer){
    clearTimeout(rainTimer);
  }
}
function genRain(){
  let y = -100;
  let num = 1;
  weatherMergeList['雨'].forEach((e,index) => {
    if(e === lives.weather){
      num = (index + 1) * (index + 1);
    }
  })
  weatherMergeList['雨夹雪'].forEach((e,index) => {
    if(e === lives.weather){
      num = (index + 1) * (index + 1);
    }
  })
  for(let i = 0; i < num;i++){
    let x = Math.random() * window.innerWidth;
    let height = Math.random()*40 + 10;
    let width = height / 50;
    let speed = height / 1;
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
  }
  //如果绘画已经停止，重新启动绘画
  if(rainArr.length === num){
    requestAnimationFrame(drawRain);
  }
  if(raining){
    rainTimer = setTimeout(() => {
      genRain();
    }, 50)
  }
}
let last = '';
let fpsThreshold = 0;
//绘制雨滴将落的效果
function drawRain(){
  if(!last){
    last = performance.now() / 1000;
  } else {
    let now = performance.now() / 1000;
    let dt = Math.min(now - last,1);
    last = now; 
    if(fpsLimit.value > 0){
      fpsThreshold += dt;
      if(fpsThreshold < 1.0 / fpsLimit.value){
        requestAnimationFrame(drawRain);
        return;
      }
      fpsThreshold -= 1.0 / fpsLimit.value;
    }
  }
  ctx.clearRect(0,0,window.innerWidth,window.innerHeight);
  rainArr.forEach((e,index) => {
    ctx.fillStyle = 'rgb(255,255,255,' + e.opacity + ')';
    ctx.fillRect(e.x,e.y,e.width,e.height);
    e.y = e.y + e.speed * (60 / fpsLimit.value);
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

// 阴天效果

function destroy(){
  //清除定时器
  if(timer){
    clearInterval(timer);
  }
  //结束下雨
  if(raining){
    stopRain();
  }
  //隐藏天气层
  if(lives.adcode){
    lives.adcode = '';
    setTimeout(() => {
      //清除数据
      for(let key in lives.value){
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
    .message{
      text-align: center;
      transition: opacity 0.5s linear;
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