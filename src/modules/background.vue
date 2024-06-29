<template>
	<div class="background-layer" v-show="showBackground">
		<div class="static" v-show="backgroundType === 'static'" :style="{ backgroundImage: 'url(' + filePath + ')' }"></div>
		<div class="slide" v-show="backgroundType === 'slide'">
			<div class="before-image" ref="beforeImageRef"></div>
			<div class="current-image" ref="currentImageRef"></div>
		</div>
	</div>
</template>

<script setup>
import { useStore } from '@/pinia';
import { ref, watch, nextTick, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import picsList from "@/assets";
const store = useStore();
const { bgSet } = storeToRefs(store);
const backgroundType = computed(() => {
	return bgSet.value.backgroundType
})
const filePath = computed(() => {
	return bgSet.value.filePath
})
const showBackground = computed(() => {
	return bgSet.value.showBackground
})

function init() {
	console.log('初始化背景层');
	console.log('bgSet', bgSet);
	if(backgroundType.value === 'slide'){
		initSlide();
	}
}
function destroy() {
	console.log('销毁背景层');
	destroySlide();
}
// 幻灯片代码部分
let timer = '';
const switchInterval = '5000';
const beforeImageRef = ref();
const currentImageRef = ref();
const currentImageFilePath = ref('');
const duration = computed(() => {
	return bgSet.value.duration
})
const fileDirectory = computed(() => {
	return bgSet.value.fileDirectory
})
onMounted(() => {
	watch(backgroundType, (val) => {
			console.log('背景类型改变', val);
			if (val === 'slide') {
				nextTick(() => {
					initSlide();
				})
			} else {
				nextTick(() => {
					destroySlide();
				})
			}
		})
		watch(duration,(val) => {
			console.log('持续时间改变',val);
			initSlide();
		})
		watch(fileDirectory,(val) => {
			console.log('文件目录改变',val);
			initSlide();
		})
})
let initDelayTimer = '';
//初始化幻灯片
function initSlide() {
	if(!fileDirectory.value){
		console.log('未检测到文件目录！');
		return;
	}
	if(initDelayTimer){
		clearTimeout(initDelayTimer)
	}
	initDelayTimer = setTimeout(() => {
		beforeImageRef.value.style.backgroundImage = '';
		currentImageRef.value.style.backgroundImage = '';
		if(duration.value > 0 && backgroundType.value === 'slide'){
			switchBackgroundImage();
			if(timer){
				clearInterval(timer);
			}
			timer = setInterval(() => {
				switchBackgroundImage();
			}, duration.value)
		}
	},100)
	
}
//切换幻灯片
function switchBackgroundImage() {
	if (process.env.NODE_ENV === 'production') {
		window.wallpaperRequestRandomFileForProperty('fileDirectory', (propertyName, filePath) => {
			filePath = 'file:///' + filePath;
			handler('', filePath);
		});
	} else if (process.env.NODE_ENV === 'development') {
		let index = Math.floor(picsList.length * Math.random());
		let filePath = picsList[index];
		console.log('filePath',filePath);
		if(filePath){
			handler('', filePath);
		}
	}

	function handler(proertyName, filePath) {
		beforeImageRef.value.style.backgroundImage = 'url(' + filePath + ')';
		let opacity = 0;
		requestAnimationFrame(picAppear);
		function picAppear(){
			beforeImageRef.value.style.opacity = opacity;
			if(opacity < 1){
				opacity += 0.005;
				requestAnimationFrame(picAppear)
			} else {
				opacity = 0;
				currentImageRef.value.style.backgroundImage = 'url(' + filePath + ')';
				beforeImageRef.value.style.opacity = '0';
			}
		}
	}
}
//销毁幻灯片
function destroySlide() {
	if(timer){
		clearInterval(timer)
	}
	beforeImageRef.value.style.backgroundImage = '';
	currentImageRef.value.style.backgroundImage = '';
}

defineExpose({
	init,
	destroy
})
</script>

<style lang="less" scoped>
.background-layer{
	width: 100%;
	height:100%;
}
.static,
.slide,
.before-image,
.current-image {
	width: 100%;
	height: 100%;
	position: absolute;
	background-repeat: no-repeat;
	background-size: cover;
	background-position: center;
}

.slide {
	.before-image {
		z-index: 1;
		transform: translate(0, 0);
	}

	.current-image {
		z-index: 0;
	}
}
</style>