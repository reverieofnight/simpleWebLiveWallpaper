<template>
  <div class="view-container">
    <backgroundModule ref="backgroundModuleRef" />
  </div>
</template>

<script setup>
import backgroundModule from '@/modules/background.vue'
import { onBeforeMount, onMounted,ref } from 'vue';
import { useStore } from "@/pinia";

const backgroundModuleRef = ref();
const store = useStore();
onMounted(() => {
  console.log('store',store);
  console.log('环境',process.env.NODE_ENV );
  if(process.env.NODE_ENV === 'production'){
     //监听用户属性改变
     //持续时间改变防抖
     let picDurationTimer = '';
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
        //背景类型
        if(properties.backgroundType){
          store.$state.bgSet.backgroundType = properties.backgroundType.value;
        }
        //文件路径
        if(properties.filePath){
          store.$state.bgSet.filePath = 'file:///' + properties.filePath.value;
        }
        //文件目录
        if(properties.fileDirectory){
          store.$state.bgSet.fileDirectory = properties.fileDirectory.value;
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
  }
 
})
</script>

<style>
.view-container{
  width: 100vw;
  height:100vh; 
}
*{
  margin:0;
  padding:0;
}
</style>
