<template>
	<div class="background-layer" v-show="showBackground">
		<img class="static" v-show="backgroundType === 'static'" :src="filePath"></img>
		<div class="slide" v-show="backgroundType === 'slide'">
			<img class="before-image" ref="beforeImageRef" :src="beforeImageSrc"></img>
			<img class="current-image" ref="currentImageRef" :src="currentImageSrc"></img>
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
const beforeImageSrc = ref('');
const currentImageSrc = ref('');
let player = null;
let playerContainer = null;
let initTimer = '';//初始化防抖定时器
let firstIn = true;
let switchAniId = '';
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
			} else if (val === 'video' && videoFilePath.value){
				initPlayer();
				nextTick(() => {
					player.play();	
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
				destoryPlayer();
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
						destoryPlayer();
					}
				} else {
					if(player){
						player.setAttribute('src',val);
						nextTick(() => {
							player.play();
						})
					} else {
						initPlayer();
						nextTick(() => {
							player.play();	
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
			beforeImageRef.value.style.transform = 'translate3d(0,0,0)';
			currentImageRef.value.style.transform = 'translate3d(0,0,0)';
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
			}
			player.volume = videoVolume.value;
			player.setAttribute('muted','muted');
			player.setAttribute('loop','loop');
			// player.classList.add('background-video');
			player.style.width = '100%';
			player.style.height = '100%';
			player.style.objectFit = 'cover';
			player.style.position = 'absolute';
			playerContainer.appendChild(player);
		}
		
	}
}
function destoryPlayer(){
	if(!player){
		return;
	}
	player.pause();
	player.removeAttribute('src');
	// player.load();
	playerContainer.removeChild(player);
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
	if(firstIn){
		firstIn = false;
		let wallpaper = getWallpaperFileInfo();
		if(wallpaper){
			let now = new Date().getTime();
			let time = wallpaper.time;
			if(now - time < duration.value){
				handler(wallpaper.filePath);
			} else {
				getWallpaperFilePath();
			}
		} else {
			getWallpaperFilePath();
		}
	} else {
		getWallpaperFilePath();
	}

	function getWallpaperFilePath(){
		if (process.env.NODE_ENV === 'production') {
			window.wallpaperRequestRandomFileForProperty('fileDirectory', (propertyName, filePath) => {
				if(filePath){
					filePath = 'file:///' + filePath;
					console.log('filePath',filePath);
					saveWallpaperFileInfo(filePath);
					handler(filePath);
				} else {
					console.log('未获取到壁纸文件！');
				}
			});
		} else if (process.env.NODE_ENV === 'development') {
			let index = Math.round((picsList.length - 1) * Math.random());
			let filePath = picsList[index];
			console.log('index',index);
			
			console.log('filePath',filePath);
			if(filePath){
				saveWallpaperFileInfo(filePath);
				handler(filePath);
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
	

	function handler(filePath) {
		//绘制动画过程
		let last = '';
		let fpsThreshold = 0;
		chooseAnimation(switchAnimation.value);

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
		
		function fade(){
			if(switchAniId){
				cancelAnimationFrame(switchAniId);
			}
			let opacity = 0;
			beforeImageSrc.value = filePath;
			beforeImageRef.value.style.opacity = opacity;
			switchAniId = requestAnimationFrame(draw);
			function draw(){
				if(!last){
					last = performance.now() / 1000;
				} else {
					let now = performance.now() / 1000;
					let dt = Math.min(now - last,1);
					last = now; 
					if(fpsLimit.value > 0){
						fpsThreshold += dt;
						if(fpsThreshold < 1.0 / fpsLimit.value){
							switchAniId = requestAnimationFrame(draw);
							return;
						}
						fpsThreshold -= 1.0 / fpsLimit.value;
					}
				}
				beforeImageRef.value.style.opacity = opacity;
				if(opacity < 1){
					opacity += 0.01 * (60 / fpsLimit.value);
					switchAniId = requestAnimationFrame(draw);
				} else {
					opacity = 0;
					currentImageSrc.value = filePath;
					beforeImageRef.value.style.opacity = '0';
				}
			}
		}
		//滑动效果
		function slide(){
			if(switchAniId){
				cancelAnimationFrame(switchAniId);
			}
			if(currentImageSrc.value){
				//设置前景图片为之前的图片
				beforeImageSrc.value = currentImageSrc.value;
				//前景图片显示在后景图片之上
				beforeImageRef.value.style.opacity = '1';
			}
			
			//后景图片的地址为要更新的图片
			currentImageSrc.value = filePath;
			//将后景图片移动到屏幕右侧外
			currentImageRef.value.style.transform = 'translate3d(100%,0,0)';
			let x = 0;
			setTimeout(() => {
				//开始绘制
				switchAniId = requestAnimationFrame(draw);
			},100)
			function draw(){
				if(!last){
					last = performance.now() / 1000;
				} else {
					let now = performance.now() / 1000;
					let dt = Math.min(now - last,1);
					last = now; 
					if(fpsLimit.value > 0){
						fpsThreshold += dt;
						if(fpsThreshold < 1.0 / fpsLimit.value){
							switchAniId = requestAnimationFrame(draw);
							return;
						}
						fpsThreshold -= 1.0 / fpsLimit.value;
					}
				}
				if(x < 100){
					beforeImageRef.value.style.transform = 'translate3d(' + -x + '%,0,0)'
					currentImageRef.value.style.transform = 'translate3d(' + (100 - x) + '%,0,0)'
					x += 1 * (60 / fpsLimit.value);
					switchAniId = requestAnimationFrame(draw);
				} else {
					beforeImageRef.value.style.opacity = '0';
					beforeImageRef.value.style.transform = 'translate3d(0,0,0)';
					currentImageRef.value.style.transform = 'translate3d(0,0,0)';
				}
			}
		}
		//当前壁纸移动到后面，使后面的壁纸显示出来
		function moveToBack(){
			console.log('moveToBack');
			if(switchAniId){
				cancelAnimationFrame(switchAniId);
			}
			if(!currentImageSrc.value){
				fade();
			} else {
				beforeImageSrc.value = currentImageSrc.value;
				beforeImageRef.value.style.opacity = 1;
				currentImageSrc.value = filePath;
				let bx = 0;
				let bxx = 0;
				let bscale = 0;
				let cscalex = 0;
				let cscale = -30;
				let duration = 1;
				currentImageRef.value.style.transform = `translate3d(0,0,${cscale}vw)`;
				let first = true;
				let second = false;
				setTimeout(() => {
					//开始绘制
					switchAniId = requestAnimationFrame(draw);
				},100)
				
				function draw(){
					if(!last){
						last = performance.now() / 1000;
					} else {
						let now = performance.now() / 1000;
						let dt = Math.min(now - last,1);
						last = now; 
						if(fpsLimit.value > 0){
							fpsThreshold += dt;
							if(fpsThreshold < 1.0 / fpsLimit.value){
								switchAniId = requestAnimationFrame(draw);
								return;
							}
							fpsThreshold -= 1.0 / fpsLimit.value;
						}
					}
					if(first && bx < 100){
						bxx += 100 / (fpsLimit.value * duration);
						bx = Math.sin(Math.PI * bxx / 200) * 100;
						bscale -= 30 / (fpsLimit.value * duration);
						beforeImageRef.value.style.transform = `translate3d(${bx}%,0,${bscale}vw)`;
						switchAniId = requestAnimationFrame(draw);
					} else if(bx >= 100){
						bx = 100;
						first = false;
						second = true;
						switchAniId = requestAnimationFrame(draw);
					}
					if(second && bx > 0 && cscale < 0){
						bxx -= 100 / (fpsLimit.value * duration);
						bx = Math.sin(Math.PI * bxx / 200) * 100;
						cscalex += 30 / (fpsLimit.value * duration);
						cscale = -30 + Math.sin(Math.PI * cscalex / 60) * 30;
						beforeImageRef.value.style.transform = `translate3d(${bx}%,0,${bscale}vw)`;
						currentImageRef.value.style.transform = `translate3d(0,0,${cscale}vw)`;
						switchAniId = requestAnimationFrame(draw);
					} else if(second && cscale >= 0){
						bx = 0;
						second = false;
						currentImageRef.value.style.transform = `translate3d(0,0,0)`;
						beforeImageRef.value.style.opacity = '0';
						beforeImageRef.value.style.transform = `translate3d(0,0,0)`;
					}
					
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
	transform-style: preserve-3d;
	.before-image {
		z-index: 1;
		transform: translate(0, 0);
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