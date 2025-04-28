import { defineStore } from "pinia"
const store = {
    state:() => {
        return {
            bgSet:{
                showBackground:'',
                backgroundType:'',
                filePath:'',
                videoFilePath:'',
                videoVolume:'',
                duration:'',
                switchAnimation:'',
            },
            clockSet:{
                showClock:false,
            },
            weatherSet:{
                showWeather:false,
                cityCode:'',
                apiKey:'',
            },
            visSet:{
                audioVisualizer:'',
                enableBar:'',
                enableCircle:'',
            },
            fpsLimit:'',
        }
    },
    actions:{
        
    },
    getters:{

    }
}
export const useStore = defineStore('store',store);