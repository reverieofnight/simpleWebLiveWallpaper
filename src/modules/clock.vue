<template>
  <div v-show="showLayer" class="clock-layer">
    <div class="clock">
      <div class="hour">
        <span class="bit">{{ time.hour.slice(0,1) }}</span>
        <span class="bit">{{ time.hour.slice(1,2) }}</span>
      </div>
      <div class="dot">:</div>
      <div class="minute">
        <span class="bit">{{ time.minute.slice(0,1) }}</span>
        <span class="bit">{{ time.minute.slice(1,2) }}</span>
      </div>
      <div class="dot">:</div>
      <div class="second">
        <span class="bit">{{ time.second.slice(0,1) }}</span>
        <span class="bit">{{ time.second.slice(1,2) }}</span>
      </div>
    </div>
    <div class="date">
      <span>{{ time.month }},</span>
      <span>{{ time.day }},</span>
      <span>{{ time.weekday }}</span>
    </div>
    <div class="year">
      {{ time.year }}
    </div>
  </div>
</template>

<script setup>
import { ref,reactive } from 'vue';
import dayjs from 'dayjs';
import translate from '@/translate/clock';
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

.clock-layer{
  left:50%;
  top:50%;
  transform: translate3d(-50%, -150px, 0);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'digital';
  color:white;
  text-shadow: 0 0 10px rgba(0,0,0,0.3);
  .clock{
    width: 1030px;
    font-size: 300px;
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
      width:150px;
      text-align: end;
    }
    .dot{
      width:75px;
    }
  }
  .date{
    font-size: 100px;
  }
  .year{
    font-size: 100px;
  }
}
</style>