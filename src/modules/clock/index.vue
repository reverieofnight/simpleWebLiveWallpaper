<template>
  <div v-show="showLayer" class="clock-layer">
    <div class="clock-wrapper">
      <div class="clock" :style="{fontSize:base * 12 + 'px'}">
        <div class="hour">
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.hour.slice(0,1) }}</span>
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.hour.slice(1,2) }}</span>
        </div>
        <div class="dot" :class="dotActive && 'active'">:</div>
        <div class="minute">
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.minute.slice(0,1) }}</span>
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.minute.slice(1,2) }}</span>
        </div>
        <div class="dot" :class="dotActive && 'active'">:</div>
        <div class="second">
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.second.slice(0,1) }}</span>
          <span class="bit" :style="{width:base * 6 + 'px'}">{{ time.second.slice(1,2) }}</span>
        </div>
      </div>
      <div class="date" :style="{fontSize:base * 4 + 'px'}">
        <span>{{ time.month }},</span>
        <span>{{ time.day }},</span>
        <span>{{ time.weekday }}</span>
      </div>
      <div class="year" :style="{fontSize:base * 4 + 'px'}">
        {{ time.year }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref,reactive } from 'vue';
import dayjs from 'dayjs';
import translate from '@/translate/clock';
const props = defineProps({
  // 时钟基础宽度
  base: {
    type: Number,
    default: 0
  }
})

const time = reactive({
  year:'',
  month:'',
  day:'',
  weekday:'',
  hour:'',
  minute:'',
  second:'',
})
//时钟更新定时器
let timer = '';
//是否显示时钟层
const showLayer = ref(false);
//点激活
const dotActive = ref(false);
function init(){
  console.log('初始化时钟层');
  showLayer.value = true;
  if(timer){
    clearInterval(timer);
  }
  timer = setInterval(() => {
    let nowTime = dayjs().format('YYYY-MM-DD HH:mm:ss');
    time.year = nowTime.slice(0,4);
    time.month = translate.month.en[nowTime.slice(5,7)];
    time.day = nowTime.slice(8,10);
    time.weekday = translate.weekday.en[dayjs().day()];
    time.hour = nowTime.slice(11,13);
    time.minute = nowTime.slice(14,16);
    if(time.second !== nowTime.slice(17.19)){
      dotActive.value = !dotActive.value;
    }
    time.second = nowTime.slice(17,19);
  },100)
}
function destroy(){
  showLayer.value = false;
  console.log('销毁时钟层');
  if(timer){
    clearInterval(timer);
  }
}

defineExpose({
  init,
  destroy,
  showLayer
})
</script>

<style lang="less" scoped>
.clock-wrapper{
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'digital';
  color:white;
  text-shadow: 0 0 10px rgba(0,0,0,0.3);
  .clock{
    display: flex;
    .hour{
      flex-shrink: 0;
    }
    .minute{
      flex-shrink: 0;
    }
    .second{
      flex-shrink: 0;
    }
    .bit{
      display: inline-block;
      text-align: end;
    }
    .dot{
      opacity: 0.4;
      transform: translateY(-5%);
    }
    .dot.active{
      opacity: 1;
    }
  }
}
</style>