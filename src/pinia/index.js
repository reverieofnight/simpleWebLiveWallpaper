import { defineStore } from "pinia"
const store = {
    state:() => {
        return {
            bgSet:{
                showBackground:'',
                backgroundType:'',
                filePath:'',
                duration:'',
            },
            clockSet:{
                showClock:false,
            },
            weatherSet:{
                showWeather:false,
                cityCode:'',
                apiKey:'',
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