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
const fpsLimit = computed(() => store.fpsLimit)
const switchAnimation = computed(() => store.bgSet.switchAnimation)
const videoVolume = computed(() => store.bgSet.videoVolume)
const picsList = [];
// import picsList from '../../../samples/backgroundImages';
const prevSrc = ref('');
const nextSrc = ref('');
const currentSrc = ref('');
let preBackSrc = '';
let nextBackSrc = '';
let player = null;
let playerContainer = null;
let initTimer = '';//初始化防抖定时器
let firstIn = true;
let switchAniId = '';//切换动画id
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
			if(switchAniId){
				cancelAnimationFrame(switchAniId);
			}
			preRef.value.style.transform = 'translate3d(0,0,0)';
			nextRef.value.style.transform = 'translate3d(0,0,0)';
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
		//绘制动画过程
		let last = '';
		let fpsThreshold = 0;
		if(!currentSrc.value){
			fade();
			return;
		}
		if(switchAniId){
			cancelAnimationFrame(switchAniId);
			preRef.value.style.opacity = '0';
			nextRef.value.style.opacity = '0';
			preRef.value.style.transform = 'translate3d(0,0,0)';
			nextRef.value.style.transform = 'translate3d(0,0,0)';
			nextTick(() => {
				chooseAnimation(switchAnimation.value);
			})
		} else {
			chooseAnimation(switchAnimation.value);
		}

		function chooseAnimation(value){
			switch(value){
				case 'fade':
					fade();
					break;
				case 'slide':
					slide();
					break;
				case 'moveToBack':
					moveToBack();
					break;
				case 'random':
					random();
					break;
				default :
					fade();
			}
		}
		//检查帧率通过绘制,不通过就跳过
		function fpsCheck(){
			if(!last){
				last = performance.now() / 1000;
				return true;
			} else {
				let now = performance.now() / 1000;
				let dt = Math.min(now - last,1);
				last = now;
				if(fpsLimit.value > 0){
					fpsThreshold += dt;
					if(fpsThreshold < 1.0 / fpsLimit.value){
						return false;
					} else {
						fpsThreshold -= 1.0 / fpsLimit.value;
						return true;
					}
				} else {
					return true;
				}
			}
		}
		// 渐变效果
		function fade(){
			let opacity = 1;
			prevSrc.value = preBackSrc;
			preRef.value.style.opacity = opacity;
			nextSrc.value = nextBackSrc;
			nextRef.value.style.opacity = 1;
			currentSrc.value = nextBackSrc;
			switchAniId = requestAnimationFrame(draw);
			function draw(){
				if(!fpsCheck()){
					switchAniId = requestAnimationFrame(draw);
					return;
				}
				preRef.value.style.opacity = opacity;
				if(opacity > 0){
					opacity -= 0.01 * (60 / fpsLimit.value);
					switchAniId = requestAnimationFrame(draw);
				} else {
					preRef.value.style.opacity = '0';
					nextRef.value.style.opacity = '0';
					currentRef.value.style.opacity = '1';
				}
			}
		}
		//滑动效果
		function slide(){
			prevSrc.value = preBackSrc;
			nextSrc.value = nextBackSrc;
			preRef.value.style.opacity = '1';
			nextRef.value.style.opacity = '1';
			preRef.value.style.transform = 'translate3d(0,0,0)';
			nextRef.value.style.transform = 'translate3d(100%,0,0)';
			currentSrc.value = nextBackSrc;
			let x = 0;
			nextTick(() => {
				switchAniId = requestAnimationFrame(draw);
			})
			function draw(){
				if(!fpsCheck()){
					switchAniId = requestAnimationFrame(draw);
					return;	
				}
				if(x > -100){
					preRef.value.style.transform = 'translate3d(' + x + '%,0,0)'
					nextRef.value.style.transform = 'translate3d(' + (100 + x) + '%,0,0)'
					x -= 1 * (60 / fpsLimit.value);
					switchAniId = requestAnimationFrame(draw);
				} else {
					preRef.value.style.opacity = '0';
					nextRef.value.style.opacity = '0';
					currentRef.value.style.opacity = '1';
					preRef.value.style.transform = 'translate3d(0,0,0)';
					nextRef.value.style.transform = 'translate3d(0,0,0)';
				}
			}
		}
		//当前壁纸移动到后面，使后面的壁纸显示出来
		function moveToBack(){
			console.log('moveToBack');
			console.log('preBackSrc',preBackSrc);
			console.log('nextBackSrc',nextBackSrc);
			
			prevSrc.value = preBackSrc;
			nextSrc.value = nextBackSrc;
			currentSrc.value = nextBackSrc;
			preRef.value.style.opacity = '1';
			nextRef.value.style.opacity = '1';
			currentRef.value.style.opacity = '0';
			let px = 0;
			let pxx = 0;
			let pscale = 0;
			let nscalex = 0;
			let nscale = -30;
			let duration = 1;
			nextRef.value.style.transform = `translate3d(0,0,${nscale}vw)`;
			let first = true;
			let second = false;
			nextTick(() => {
				switchAniId = requestAnimationFrame(draw);
			})
			function draw(){
				if(!fpsCheck()){
					switchAniId = requestAnimationFrame(draw);
					return;	
				}
				// 前壁纸移动到后面
				if(first && px < 100){
					pxx += 100 / (fpsLimit.value * duration);
					px = Math.sin(Math.PI * pxx / 200) * 100;
					pscale -= 30 / (fpsLimit.value * duration);
					preRef.value.style.transform = `translate3d(${px}%,0,${pscale}vw)`;
					switchAniId = requestAnimationFrame(draw);
				} else if(px >= 100){
					px = 100;
					first = false;
					second = true;
					switchAniId = requestAnimationFrame(draw);
				}
				// 后壁纸移动到前面
				if(second && px > 0 && nscale < 0){
					pxx -= 100 / (fpsLimit.value * duration);
					px = Math.sin(Math.PI * pxx / 200) * 100;
					nscalex += 30 / (fpsLimit.value * duration);
					nscale = -30 + Math.sin(Math.PI * nscalex / 60) * 30;
					preRef.value.style.transform = `translate3d(${px}%,0,${pscale}vw)`;
					nextRef.value.style.transform = `translate3d(0,0,${nscale}vw)`;
					switchAniId = requestAnimationFrame(draw);
				} else if(second && nscale >= 0){
					px = 0;
					second = false;
					nextRef.value.style.transform = `translate3d(0,0,0)`;
					preRef.value.style.transform = `translate3d(0,0,0)`;
					preRef.value.style.opacity = '0';
					nextRef.value.style.opacity = '0';
					currentRef.value.style.opacity = '1';
				}
				
			}
		}
		function random(){
			let animationList = ['fade','slide','moveToBack'];
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
	background-size: cover;
	position: absolute;
	transform: translate3d(0,0,0);
}

.slide {
	transform-style: preserve-3d;
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
.background-layer {
	perspective: 1000px;
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