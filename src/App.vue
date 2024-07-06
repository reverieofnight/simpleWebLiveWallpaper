<template>
  <div class="view-container">
    <backgroundModule ref="backgroundModuleRef" />
    <weatherModule ref="weatherModuleRef" />
    <clockModule ref="clockModuleRef" />
    <audioVisualizerModule ref="audioVisualizerModuleRef" />
  </div>
</template>

<script setup>
import backgroundModule from '@/modules/background/index.vue'
import clockModule from '@/modules/clock/index.vue';
import weatherModule from '@/modules/weather/index.vue';
import audioVisualizerModule from '@/modules/audioVisualizer/index.vue';
import { onMounted,ref } from 'vue';
import { useStore } from "@/pinia";
import emitter from '@/utils/mitt';

const backgroundModuleRef = ref();
const clockModuleRef = ref();
const weatherModuleRef = ref();
const audioVisualizerModuleRef = ref();
const store = useStore();
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
    //持续时间为6s
    store.bgSet.duration = 0.1 * 1000 * 60;
    //文件目录
    store.bgSet.fileDirectory = 'fileDirectory';
    backgroundModuleRef.value.init();
    //显示时钟
    store.clockSet.showClock = true;
    clockModuleRef.value.init();
    //显示天气
    // store.weatherSet.cityCode = '110000';//北京市
    //apiKey
    store.weatherSet.apiKey = 'c7fee6c6ae63763b4d8529c9a8589c83';
    weatherModuleRef.value.init();
    //音频可视化
    store.visSet.audioVisualizer = true;
    audioVisualizerModuleRef.value.init();
    //设置fps
    store.fpsLimit = 60;
    console.log('帧数限制',store.fpsLimit);
  }
  window.onresize = () => {
    emitter.emit('windowResize');
  }
})

</script>

<style lang="less">
@font-face {
  font-family: "digital";
  src: url("@/assets/fonts/digital.ttf");
}

.view-container{
  width: 100vw;
  height:100vh;
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
}
*{
  margin:0;
  padding:0;
}
</style>
