<template>
	<div class="background-layer" v-show="showBackground">
		<img class="static" v-show="backgroundType === 'static'" :src="filePath"></img>
		<div class="slide" v-show="backgroundType === 'slide'">
			<img class="before-image" ref="beforeImageRef" :src="beforeImageSrc"></img>
			<img class="current-image" ref="currentImageRef" :src="currentImageSrc"></img>
		</div>
	</div>
</template>

<script setup>
import { useStore } from '@/pinia';
import { ref, watch, nextTick, computed, onMounted } from 'vue';
const store = useStore();
const backgroundType = computed(() => store.bgSet.backgroundType)
const filePath = computed(() => store.bgSet.filePath)
const showBackground = computed(() => store.bgSet.showBackground)
// const picsList = [];
import picsList from '../../../samples/backgroundImages';
const beforeImageSrc = ref('');
const currentImageSrc = ref('');
let initTimer = '';//初始化防抖定时器
function init() {
	if(initTimer){
		clearTimeout(initTimer);
	}
	initTimer = setTimeout(() => {
		console.log('初始化背景层');
		if(backgroundType.value === 'slide'){
			initSlide();
		}
	},100)
	
}
function destroy() {
	console.log('销毁背景层');
	destroySlide();
}
// 幻灯片代码部分
let timer = '';
const beforeImageRef = ref();
const currentImageRef = ref();
const duration = computed(() => store.bgSet.duration)
const fileDirectory = computed(() => store.bgSet.fileDirectory)
onMounted(() => {
	watch(backgroundType, (val) => {
			console.log('背景类型改变', val);
			if (val === 'slide') {
				nextTick(() => {
					initSlide();
				})
			} else {
				if(process.env.NODE_ENV === 'development'){
					if(backgroundType.value === 'static'){
						let index = Math.floor(picsList.length * Math.random());
						let filePath = picsList[index];
						store.bgSet.filePath = filePath;
					}
				}
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
		beforeImageSrc.value = filePath;
		let opacity = 0;
		requestAnimationFrame(picAppear);
		// requestAnimationFrame(picAppear);
		//绘制动画过程
		const fpsLimit = computed(() => store.fpsLimit)
		let last = '';
		let fpsThreshold = 0;
		function picAppear(){
			if(!last){
				last = performance.now() / 1000;
			} else {
				let now = performance.now() / 1000;
				let dt = Math.min(now - last,1);
				last = now; 
				if(fpsLimit.value > 0){
					fpsThreshold += dt;
					if(fpsThreshold < 1.0 / fpsLimit.value){
						requestAnimationFrame(picAppear);
						return;
					}
					fpsThreshold -= 1.0 / fpsLimit.value;
				}
			}
			beforeImageRef.value.style.opacity = opacity;
			if(opacity < 1){
				opacity += 0.01 * (60 / fpsLimit.value);
				requestAnimationFrame(picAppear)
			} else {
				opacity = 0;
				currentImageSrc.value = filePath;
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
//选择src为空字符串或不包含src属性的img
img[src=""],img:not([src]){
    opacity:0;
}
.static,
.slide,
.before-image,
.current-image {
	width: 100%;
	height: 100%;
	object-fit:cover;
	position: absolute;
	transform: translate3d(0,0,0);
	// background-repeat: no-repeat;
	// background-size: cover;
	// background-position: center;
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