const iconNameList = {
  '风':'2051',
  '多云':'101',
  '雪':'499',
  '雾':'501',
  '晴':'100',
  '雨夹雪':'405',
  '雨':'399',
  '阴':'104',
  '霾':'502',
  '未知':'999',
}
export const weatherMergeList = {
  '风': ['有风', '平静', '微风', '和风', '清风', '强风/劲风', '疾风', '大风', '烈风', '风暴', '狂爆风', '飓风', '热带风暴', '龙卷风'],
  '多云': ['少云', '晴间多云', '多云'],
  '雪': ['雪', '阵雪', '小雪', '中雪', '大雪', '暴雪', '小雪-中雪', '中雪-大雪', '大雪-暴雪', '冷'],
  '雾': ['浮尘', '扬沙', '沙尘暴', '强沙尘暴', '雾', '浓雾', '强浓雾', '轻雾', '大雾', '特强浓雾'],
  '晴': ['晴', '热'],
  '雨夹雪': ['雨雪天气', '雨夹雪', '阵雨夹雪'],
  '雨': ['阵雨', '雷阵雨', '雷阵雨并伴有冰雹', '小雨', '中雨', '大雨', '暴雨', '大暴雨', '特大暴雨', '强阵雨', '强雷阵雨', '极端降雨', '毛毛雨/细雨', '雨', '小雨-中雨', '中雨-大雨', '大雨-暴雨', '暴雨-大暴雨', '大暴雨-特大暴雨', '冻雨'],
  '阴': ['阴'],
  '霾':['霾', '中度霾', '重度霾', '严重霾'],
  '未知':['未知']
}
export function weatherToIcon (weather){
  let name = '';
  Object.keys(weatherMergeList).forEach((key) => {
    weatherMergeList[key].forEach((i) => {
      if(weather === i){
        name = key;
      }
    })
  })
  return iconNameList[name];
}
export function weatherMerge(weather){
  let name = '';
  Object.keys(weatherMergeList).forEach((key) => {
    weatherMergeList[key].forEach((i) => {
      if(weather === i){
        name = key;
      }
    })
  })
  return name;
}