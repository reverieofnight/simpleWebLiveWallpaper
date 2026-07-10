<template>
	<div class="background-layer" v-show="showBackground">
		<img class="static" v-show="backgroundType === 'static'" :src="filePath"></img>
		<div class="slide" v-show="backgroundType === 'slide'">
			<img class="prev-image" ref="preRef" :src="prevSrc" alt="之前壁纸">
			<img class="next-image" ref="nextRef" :src="nextSrc" alt="之后壁纸">
			<img class="current-image" ref="currentRef" :src="currentSrc" alt="当前壁纸">
		</div>
		 <div id="videoContainer" v-show="backgroundType === 'video'"></div>
	</div>
</template>

<script setup>
import { useStore } from '@/pinia';
import { ref, watch, nextTick, computed, onMounted } from 'vue';
const store = useStore();
const backgroundType = computed(() => store.bgSet.backgroundType)
const filePath = computed(() => store.bgSet.filePath)
// const videoFilePath = new URL('../../../samples/GalaxyHome.mp4', import.meta.url);
const videoFilePath = computed(() => store.bgSet.videoFilePath)
const showBackground = computed(() => store.bgSet.showBackground)
const switchAnimation = computed(() => store.bgSet.switchAnimation)
const videoVolume = computed(() => store.bgSet.videoVolume)
// const picsList = [];
import picsList from '../../../samples/backgroundImages';
const prevSrc = ref('');
const nextSrc = ref('');
const currentSrc = ref('');
let preBackSrc = '';
let nextBackSrc = '';
let player = null;
let playerContainer = null;
let firstIn = true;
let switchTimer = null;
let switchCleanup = null;
function init() {
	console.log('初始化背景层');
	if(backgroundType.value === 'slide'){
		initSlide();
	}
	
}
function destroy() {
	console.log('销毁背景层');
	destroySlide();
	destroyPlayer();
}
// 幻灯片代码部分
let timer = '';
const preRef = ref();
const nextRef = ref();
const currentRef = ref();
const duration = computed(() => store.bgSet.duration)
const fileDirectory = computed(() => store.bgSet.fileDirectory)
onMounted(() => {
	watch(backgroundType, (val) => {
			console.log('背景类型改变', val);
			if (val === 'slide') {
				nextTick(() => {
					initSlide();
				})
			} else if (val === 'video' && videoFilePath.value){
				initPlayer();
				nextTick(() => {
					player.play().catch((error) => {
						console.error('视频播放失败:', error);
					})	
				})
			} else {
				if(process.env.NODE_ENV === 'development'){
					if(backgroundType.value === 'static'){
						let index = Math.round(picsList.length * Math.random());
						let filePath = picsList[index];
						store.bgSet.filePath = filePath;
					}
				}
				nextTick(() => {
					destroySlide();
				})
			}
			if(val !== 'video' && player){
				destroyPlayer();
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
		watch(videoFilePath,(val) => {
			console.log('视频文件路径改变',val);
			if(backgroundType.value === 'video'){
				if(val === 'file:///'){
					if(player){
						destroyPlayer();
					}
				} else {
					if(player){
						player.setAttribute('src',val);
						nextTick(() => {
							player.play().catch((error) => {
								console.error('视频播放失败:', error);
							})
						})
					} else {
						initPlayer();
						nextTick(() => {
							player.play().catch((error) => {
								console.error('视频播放失败:', error);
							})
						})
					}
				}
			}
		})
		watch(videoVolume,(val) => {
			console.log('视频音量改变',val);
			if(player){
				player.volume = val;
			}	
		})
		watch(switchAnimation,(val) => {
			console.log('切换动画效果改变',val);
			// 立即重置过渡状态
			if(switchTimer){
				clearTimeout(switchTimer);
				switchTimer = null;
			}
			if(switchCleanup){
				preRef.value?.removeEventListener('transitionend', switchCleanup);
				nextRef.value?.removeEventListener('transitionend', switchCleanup);
				switchCleanup = null;
			}
			preRef.value.style.transition = 'none';
			nextRef.value.style.transition = 'none';
			preRef.value.style.transform = '';
			nextRef.value.style.transform = '';
			preRef.value.style.opacity = '';
			nextRef.value.style.opacity = '';
			void preRef.value.offsetHeight;
			preRef.value.style.transition = '';
			nextRef.value.style.transition = '';
			initSlide();
		})
})
let initDelayTimer = '';
function initPlayer(){
	if(player){
		return;
	} else {
		playerContainer = document.getElementById('videoContainer');
		if(playerContainer){
			player = document.createElement('video');
			if(videoFilePath.value && videoFilePath.value !== 'file:///'){
				player.setAttribute('src',videoFilePath.value);
				player.onerror = () => {
					console.error('视频文件加载失败！',videoFilePath.value);
				}
			}
			player.volume = videoVolume.value;
			player.loop = true;
			player.style.width = '100%';
			player.style.height = '100%';
			player.style.objectFit = 'cover';
			player.style.position = 'absolute';
			playerContainer.appendChild(player);
		}
		
	}
}
function destroyPlayer(){
	if(!player){
		return;
	}
	player.pause();
	player.removeAttribute('src');
	player.load();//重新加载视频元素
	// 检查 playerContainer 是否存在
	if (playerContainer && playerContainer.contains(player)) {
		playerContainer.removeChild(player);
	}
	player = null;
}
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
		preRef.value.style.backgroundImage = '';
		currentRef.value.style.backgroundImage = '';
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
// 预加载图片
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = reject;
  });
}
//切换幻灯片
async function switchBackgroundImage() {
	if(firstIn){
		firstIn = false;
		let wallpaper = getWallpaperFileInfo();
		if(wallpaper){
			let now = new Date().getTime();
			let time = wallpaper.time;
			if(now - time < duration.value){
				await preloadImage(wallpaper.filePath);
				if(nextBackSrc){
					preBackSrc = nextBackSrc;
				}
				nextBackSrc = wallpaper.filePath;
				handler();
			} else {
				await getWallpaperFilePath();
			}
		} else {
			await getWallpaperFilePath();
		}
	} else {
		await getWallpaperFilePath();
	}

	async function getWallpaperFilePath(){
		if (process.env.NODE_ENV === 'production') {
			return new Promise((resolve,reject) => {
				window.wallpaperRequestRandomFileForProperty('fileDirectory',async (propertyName, filePath) => {
					if(filePath){
						filePath = 'file:///' + filePath;
						console.log('filePath',filePath);
						await preloadImage(filePath);
						saveWallpaperFileInfo(filePath);
						if(nextBackSrc){
							preBackSrc = nextBackSrc;
						}
						nextBackSrc = filePath;
						handler();
					} else {
						console.log('未获取到壁纸文件！');
					}
				});
			})
		} else if (process.env.NODE_ENV === 'development') {
			let index = Math.round((picsList.length - 1) * Math.random());
			let filePath = picsList[index];
			console.log('index',index);
			console.log('filePath',filePath);
			if(filePath){
				await preloadImage(filePath);
				saveWallpaperFileInfo(filePath);
				if(nextBackSrc){
					preBackSrc = nextBackSrc;
				}
				nextBackSrc = filePath;
				handler();
			} else {
				console.log('未检测到壁纸文件！');
			}
		}
	}
	//将当前壁纸地址保存在本地
	function saveWallpaperFileInfo(filePath) {
		localStorage.setItem('wallpaperFileInfo',JSON.stringify({
			filePath:filePath,
			time:new Date().getTime()
		}));
	}
	//获取本地保存的壁纸信息
	function getWallpaperFileInfo() {
		let wallpaperFileInfo = JSON.parse(localStorage.getItem('wallpaperFileInfo'));
		if(wallpaperFileInfo){
			return wallpaperFileInfo;
		} else {
			return false;
		}
	}
	

	function handler() {
		// 取消正在进行的动画、定时器和transitionend监听
		if(switchTimer){
			clearTimeout(switchTimer);
			switchTimer = null;
		}
		if(switchCleanup){
			preRef.value?.removeEventListener('transitionend', switchCleanup);
			nextRef.value?.removeEventListener('transitionend', switchCleanup);
			switchCleanup = null;
		}
		preRef.value.style.transition = 'none';
		nextRef.value.style.transition = 'none';
		preRef.value.style.transform = '';
		nextRef.value.style.transform = '';
		preRef.value.style.opacity = '0';
		nextRef.value.style.opacity = '0';
		void preRef.value.offsetHeight;
		preRef.value.style.transition = '';
		nextRef.value.style.transition = '';

		if(!currentSrc.value){
			// 首次初始化，第一张图片从黑暗中淡入
			if(preBackSrc){
				prevSrc.value = preBackSrc;
			}
			nextSrc.value = nextBackSrc;
			currentSrc.value = nextBackSrc;
			currentRef.value.style.opacity = '0';
			// 强制浏览器回流，让上面的 opacity=0 先生效，再设置 opacity=1 才能触发过渡动画
			void currentRef.value.offsetHeight;
			currentRef.value.style.transition = 'opacity 1s ease';
			currentRef.value.style.opacity = '1';
			currentRef.value.addEventListener('transitionend', () => {
				currentRef.value.style.transition = '';
			}, { once: true });
			return;
		}
		nextTick(() => {
			chooseAnimation(switchAnimation.value);
		})

		// 动画结束后的统一清理
		const onTransitionEnd = () => {
			switchCleanup = null;
			switchTimer = null;
			preRef.value.style.transition = '';
			nextRef.value.style.transition = '';
			preRef.value.style.transform = '';
			nextRef.value.style.transform = '';
			preRef.value.style.opacity = '0';
			nextRef.value.style.opacity = '0';
			currentRef.value.style.opacity = '1';
		};

		function chooseAnimation(value){
			switch(value){
				case 'fade':
					fade();
					break;
				case 'slide':
					slide();
					break;
				case 'random':
					random();
					break;
				default :
					fade();
			}
		}
		// 渐变效果
		function fade(){
			const duration = 1;
			prevSrc.value = preBackSrc;
			nextSrc.value = nextBackSrc;
			currentSrc.value = nextBackSrc;

			nextRef.value.style.transition = 'none';
			nextRef.value.style.transform = '';
			nextRef.value.style.opacity = '1';
			preRef.value.style.transition = 'none';
			preRef.value.style.transform = '';
			preRef.value.style.opacity = '1';
			void preRef.value.offsetHeight;

			preRef.value.style.transition = `opacity ${duration}s ease`;
			preRef.value.style.opacity = '0';

			switchCleanup = onTransitionEnd;
			preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
		}
		//滑动效果
		function slide(){
			const duration = 1.5;
			prevSrc.value = preBackSrc;
			nextSrc.value = nextBackSrc;
			currentSrc.value = nextBackSrc;

			preRef.value.style.transition = 'none';
			nextRef.value.style.transition = 'none';
			preRef.value.style.opacity = '1';
			nextRef.value.style.opacity = '1';
			preRef.value.style.transform = '';
			nextRef.value.style.transform = 'translateX(100%)';
			void preRef.value.offsetHeight;

			preRef.value.style.transition = `transform ${duration}s ease`;
			nextRef.value.style.transition = `transform ${duration}s ease`;
			preRef.value.style.transform = 'translateX(-100%)';
			nextRef.value.style.transform = '';

			switchCleanup = onTransitionEnd;
			preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
			nextRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
		}
		function random(){
			let animationList = ['fade','slide'];
			let index = Math.round((animationList.length - 1) * Math.random());
			chooseAnimation(animationList[index]);
		}
	}
}
//销毁幻灯片
function destroySlide() {
	if(timer){
		clearInterval(timer)
	}
	preRef.value.style.backgroundImage = '';
	currentRef.value.style.backgroundImage = '';
}
// 手动切换壁纸
function handleClickNext(){
	if(backgroundType.value ==='slide'){
		switchBackgroundImage();
	}
}
defineExpose({
	init,
	destroy,
	handleClickNext
	
})
</script>

<style lang="less" scoped>
//选择src为空字符串或不包含src属性的img
img[src=""],img:not([src]){
  opacity:0;
}
.static,
.slide,
.prev-image,
.next-image,
.current-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	position: absolute;
}

.slide {
	.prev-image {
		z-index: 2;
	}
	.next-image {
		z-index: 1;
	}

	.current-image {
		z-index: 0;
	}
}
#videoContainer{
	width: 100%;
	height: 100%;
}
.background-video {
	width: 100%;
	height: 100%;
	object-fit:cover;
	position: absolute;
}
</style>