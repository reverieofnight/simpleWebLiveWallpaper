<template>
  <div class="view-container">
    <backgroundModule ref="backgroundModuleRef" />
    <audioVisualizerModule ref="audioVisualizerModuleRef" />
    <weatherModule ref="weatherModuleRef" />
    <clockModule ref="clockModuleRef" />
    <div class="control-panel" v-if="backgroundType === 'slide'">
      <button class="button" @click="handleClickNext">下一张</button>
    </div>
  </div>
</template>

<script setup>
import backgroundModule from '@/modules/background/index.vue'
import clockModule from '@/modules/clock/index.vue';
import weatherModule from '@/modules/weather/index.vue';
import audioVisualizerModule from '@/modules/audioVisualizer/index.vue';
import { onMounted,ref,computed } from 'vue';
import { useStore } from "@/pinia";
import emitter from '@/utils/mitt';

const backgroundModuleRef = ref();
const clockModuleRef = ref();
const weatherModuleRef = ref();
const audioVisualizerModuleRef = ref();
const store = useStore();
const backgroundType = computed(() => store.bgSet.backgroundType)
onMounted(() => {
  console.log('store',store);
  console.log('环境',process.env.NODE_ENV );
  if(process.env.NODE_ENV === 'production'){
     //监听用户属性改变
     //持续时间改变防抖
     let picDurationTimer = '';
     //城市编码输入防抖
     let cityCodeTimer = '';
     //apiKey输入防抖
     let apiKeyTimer = '';
    window.wallpaperPropertyListener = {
      applyUserProperties: function (properties) {
        console.log('用户属性改变', properties);
        //显示背景
        if(properties.showBackground){
          let showBackground = properties.showBackground.value;
          store.bgSet.showBackground = showBackground;
          if(showBackground === true){
            backgroundModuleRef.value.init();
          } else if(showBackground === false){
            backgroundModuleRef.value.destroy();
          }
        }
        //背景类型，文件目录
        Object.keys(properties).forEach((key) => {
          if(['backgroundType','fileDirectory'].includes(key)){
            store.bgSet[key] = properties[key].value;
          }
        })
        //文件路径
        if(properties.filePath){
          store.bgSet.filePath = 'file:///' + properties.filePath.value;
        }
        //视频文件路径
        if(properties.videoFilePath){
          store.bgSet.videoFilePath = 'file:///' + properties.videoFilePath.value;
        }
        //视频音量
        if(properties.videoVolume){
          store.bgSet.videoVolume = properties.videoVolume.value;
        }
        //持续时间
        if(properties.picDuration){
          if(!store.bgSet.duration){
            store.bgSet.duration = properties.picDuration.value * 1000 * 60;
          } else {
            if(picDurationTimer){
              clearTimeout(picDurationTimer);
            }
            picDurationTimer = setTimeout(() => {
              store.bgSet.duration = properties.picDuration.value * 1000 * 60;
            }, 1000);
          }
          
        }
        //切换动画效果
        if(properties.switchAnimation){
          store.bgSet.switchAnimation = properties.switchAnimation.value;
        }
        //显示时钟
        if(properties.showClock){
          let showClock = properties.showClock.value;
          store.clockSet.showClock = showClock;
          if(showClock === true){
            clockModuleRef.value.init();
          } else {
            clockModuleRef.value.destroy();
          }
        }
        //显示天气
        if(properties.showWeather){
          let showWeather = properties.showWeather.value;
          store.weatherSet.showWeather = showWeather;
          if(showWeather === true){
            weatherModuleRef.value.init();
          } else {
            weatherModuleRef.value.destroy();
          }
        }
        //城市编码
        if(properties.cityCode){
          let cityCode = properties.cityCode.value;
          if( cityCode.length === 6){
            if(!store.weatherSet.cityCode){
              store.weatherSet.cityCode = cityCode;
              weatherModuleRef.value.init();
            } else {
              if(cityCodeTimer){
                clearTimeout(cityCodeTimer);
              }
              cityCodeTimer = setTimeout(() => {
                store.weatherSet.cityCode = cityCode;
                weatherModuleRef.value.init();
              }, 1000);
            }
          }
          
        }
        //定位apiKey
        if(properties.apiKey){
          let apiKey = properties.apiKey.value;
          if(!store.weatherSet.apiKey){
            store.weatherSet.apiKey = apiKey;
            weatherModuleRef.value.init();
          } else {
            if(apiKeyTimer){
              clearTimeout(apiKeyTimer);
            }
            apiKeyTimer = setTimeout(() => {
              store.weatherSet.apiKey = apiKey;
              weatherModuleRef.value.init();
            }, 1000);
          }
        }
        //音频可视化
        if(properties.audioVisualizer){
          let audioVisualizer = properties.audioVisualizer.value;
          store.visSet.audioVisualizer = audioVisualizer;
          if(audioVisualizer === true){
            audioVisualizerModuleRef.value.init();
          } else {
            audioVisualizerModuleRef.value.destroy();
          }
        }
        //条形可视化
        if(properties.enableBar){
          let enableBar = properties.enableBar.value;
          store.visSet.enableBar = enableBar;
        }
        //圆形可视化
        if(properties.enableCircle){
          let enableCircle = properties.enableCircle.value;
          store.visSet.enableCircle = enableCircle;
        }
        //显示FPS
        if(properties.showFPS){
          let showFPS = properties.showFPS.value;
          store.visSet.showFPS = showFPS;
        }
      },
      applyGeneralProperties:function(properties){
        if(properties.fps){
          store.fpsLimit = properties.fps;
          console.log('帧数限制',store.fpsLimit);
        }
      }
    }
  } else if( process.env.NODE_ENV === 'development'){
    //显示背景层
    store.bgSet.showBackground = true;
    //背景类型为幻灯片
    store.bgSet.backgroundType = 'slide';
    //持续时间
    store.bgSet.duration = 1 * 1000 * 60;
    //切换效果
    store.bgSet.switchAnimation = 'random';
    //文件目录
    store.bgSet.fileDirectory = 'fileDirectory';
    // 视频音量
    store.bgSet.videoVolume = 0.5;
    backgroundModuleRef.value.init();
    //显示时钟
    store.clockSet.showClock = true;
    clockModuleRef.value.init();
    //显示天气
    store.weatherSet.cityCode = '320281';//江阴市
    //apiKey
    store.weatherSet.apiKey = 'c7fee6c6ae63763b4d8529c9a8589c83';
    weatherModuleRef.value.init();
    //音频可视化
    store.visSet.audioVisualizer = true;
    store.visSet.enableBar = true;
    store.visSet.enableCircle = true;
    store.visSet.showFPS = true;
    audioVisualizerModuleRef.value.init();
    //设置fps
    store.fpsLimit = 165;
    console.log('帧数限制',store.fpsLimit);
  }
  window.onresize = () => {
    emitter.emit('windowResize');
  }
})

function handleClickNext(){
  backgroundModuleRef.value.handleClickNext();
}

</script>

<style lang="less">
@font-face {
  font-family: "digital";
  src: url("@/assets/fonts/digital.ttf");
}

.view-container{
  width: 100vw;
  height:100vh;
  background-color: black;
  .background-layer,
  .weather-layer,
  .audio-visualizer-layer,
  .clock-layer
  {
    width: 100%;
    height:100%;
    overflow: hidden;
    position: absolute;
    z-index: 0;
    transform: translate3d(0,0,0);
  }
  .control-panel{
    padding:20px;
    position: absolute;
    right:5%;
    top:20%;
    z-index: 999;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    &:hover{
      opacity: 1; 
    }
    .button{
      padding:10px 20px;
      margin:10px;
      font-size:20px;
      font-weight: bold;
      cursor: pointer;
      color:white;
      text-shadow: 0 0 3px rgba(0,0,0,0.7);
      background-color: rgba(255,255,255,0.3);
      border:1px solid white;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.4);
      opacity: 0.7;
    }
    
  }
}
*{
  margin:0;
  padding:0;
}
</style>
