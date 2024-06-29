import { defineStore } from "pinia"
const store = {
    state:() => {
        return {
            bgSet:{
                showBackground:false,
                backgroundType:'',
                filePath:'',
                duration:'',
            },
            clockSet:{
                showClock:false,
            }
        }
    },
    actions:{
        
    },
    getters:{

    }
}
export const useStore = defineStore('store',store);