import { defineStore } from "pinia"
const store = {
    state:() => {
        return {
            bgSet:{
                showBackground:'',
                backgroundType:'',
                filePath:'',
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