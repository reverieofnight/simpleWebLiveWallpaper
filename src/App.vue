<template>
  <div class="view-container">
    <backgroundModule ref="backgroundModuleRef" />
    <weatherModule ref="weatherModuleRef" />
    <clockModule ref="clockModuleRef" />
  </div>
</template>

<script setup>
import backgroundModule from '@/modules/background.vue'
import clockModule from '@/modules/clock.vue';
import weatherModule from '@/modules/weather.vue';
import { onMounted,ref } from 'vue';
import { useStore } from "@/pinia";

const backgroundModuleRef = ref();
const clockModuleRef = ref();
const weatherModuleRef = ref();
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
    window.wallpaperPropertyListener = {
      applyUserProperties: function (properties) {
        console.log('用户属性改变', properties);
        //显示背景
        if(properties.showBackground){
          let showBackground = properties.showBackground.value;
          store.$state.bgSet.showBackground = showBackground;
          if(showBackground === true){
            backgroundModuleRef.value.init();
          } else if(showBackground === false){
            backgroundModuleRef.value.destroy();
          }
        }
        //背景类型，文件目录
        Object.keys(properties).forEach((key) => {
          if(['backgroundType','fileDirectory'].includes(key)){
            store.$state.bgSet[key] = properties[key].value;
          }
        })
        //文件路径
        if(properties.filePath){
          store.$state.bgSet.filePath = 'file:///' + properties.filePath.value;
        }
        //持续时间
        if(properties.picDuration){
          if(!store.$state.bgSet.duration){
            store.$state.bgSet.duration = properties.picDuration.value * 1000 * 60;
          } else {
            if(picDurationTimer){
              clearTimeout(picDurationTimer);
            }
            picDurationTimer = setTimeout(() => {
              store.$state.bgSet.duration = properties.picDuration.value * 1000 * 60;
            }, 1000);
          }
          
        }
        //显示时钟
        if(properties.showClock){
          let showClock = properties.showClock.value;
          store.$state.clockSet.showClock = showClock;
          if(showClock === true){
            clockModuleRef.value.init();
          } else {
            clockModuleRef.value.destroy();
          }
        }
        //显示天气
        if(properties.showWeather){
          let showWeather = properties.showWeather.value;
          store.$state.weatherSet.showWeather = showWeather;
          if(showWeather === true){
            weatherModuleRef.value.init();
          } else {
            weatherModuleRef.value.destroy();
          }
        }
        if(properties.cityCode){
          if(properties.cityCode.value.length < 6){
            return;
          }
          if(!store.$state.weatherSet.cityCode){
            store.$state.weatherSet.cityCode = properties.cityCode.value;
          } else {
            if(cityCodeTimer){
              clearTimeout(cityCodeTimer);
            }
            cityCodeTimer = setTimeout(() => {
              store.$state.weatherSet.cityCode = properties.cityCode.value;
              weatherModuleRef.value.init();
            }, 1000);
          }
        }
      },
    }
  } else if( process.env.NODE_ENV === 'development'){
    //显示背景层
    store.$state.bgSet.showBackground = true;
    //背景类型为幻灯片
    store.$state.bgSet.backgroundType = 'slide';
    //持续时间为6s
    store.$state.bgSet.duration = 0.2 * 1000 * 60;
    //文件目录
    store.$state.bgSet.fileDirectory = 'fileDirectory';
    backgroundModuleRef.value.init();
    //显示时钟
    store.$state.clockSet.showClock = true;
    clockModuleRef.value.init();
    //显示天气
    store.$state.weatherSet.cityCode = '320281';
    weatherModuleRef.value.init();
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
  .background-layer{
    position: absolute;
    z-index: 0;
  }
  .weather-layer{
    position: absolute;
    z-index:1
  }
  .clock-layer{
    position: absolute;
    z-index: 2;
  }
}
*{
  margin:0;
  padding:0;
}
</style>
