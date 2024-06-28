import { defineStore } from "pinia"
const store = {
    state:() => {
        return {
            showBackground:false,
            backgroundType:'',
            filePath:'',
            bgSet:{
                showBackground:false,
                backgroundType:'',
                filePath:'',
                duration:'',
            }
        }
    },
    actions:{
        
    },
    getters:{

    }
}
export const useStore = defineStore('store',store);