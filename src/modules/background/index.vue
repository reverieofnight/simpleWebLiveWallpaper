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
// 幻灯片专用
let timer = null;
let initDelayTimer = null;
const preRef = ref();
const nextRef = ref();
const currentRef = ref();
const duration = computed(() => store.bgSet.duration)
const fileDirectory = computed(() => store.bgSet.fileDirectory)

/** 切换过渡时长（秒） */
const DURATION = 1.5;

// ==================== 辅助函数 ====================

// 预加载图片
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(src);
    img.onerror = reject;
  });
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
	try {
		let wallpaperFileInfo = JSON.parse(localStorage.getItem('wallpaperFileInfo'));
		if(wallpaperFileInfo && wallpaperFileInfo.filePath){
			return wallpaperFileInfo;
		}
	} catch(e) {
		// localStorage 数据损坏，重新获取
	}
	return null;
}

// ==================== 动画核心 ====================

/** 动画结束后统一重置样式和清理状态 */
function onTransitionEnd() {
	switchCleanup = null;
	switchTimer = null;
	preRef.value.style.transition = '';
	nextRef.value.style.transition = '';
	preRef.value.style.transform = '';
	nextRef.value.style.transform = '';
	preRef.value.style.filter = '';
	nextRef.value.style.filter = '';
	preRef.value.style.opacity = '0';
	nextRef.value.style.opacity = '0';
	nextRef.value.style.zIndex = '';
	currentRef.value.style.opacity = '1';
}
/** 淡入淡出切换：旧图渐出、新图直接显示 */
function fade(){
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

	preRef.value.style.transition = `opacity ${DURATION}s ease`;
	preRef.value.style.opacity = '0';

	switchCleanup = onTransitionEnd;
	preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 向左滑动切换：右图从右侧滑入、旧图向左滑出 */
function slideLeft(){
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

	preRef.value.style.transition = `transform ${DURATION}s ease`;
	nextRef.value.style.transition = `transform ${DURATION}s ease`;
	preRef.value.style.transform = 'translateX(-100%)';
	nextRef.value.style.transform = '';

	switchCleanup = onTransitionEnd;
	preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
	nextRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 向上滑动切换：新图从下方滑入、旧图向上滑出 */
function slideUp(){
	prevSrc.value = preBackSrc;
	nextSrc.value = nextBackSrc;
	currentSrc.value = nextBackSrc;

	preRef.value.style.transition = 'none';
	nextRef.value.style.transition = 'none';
	preRef.value.style.opacity = '1';
	nextRef.value.style.opacity = '1';
	preRef.value.style.transform = '';
	nextRef.value.style.transform = 'translateY(100%)';
	void preRef.value.offsetHeight;

	preRef.value.style.transition = `transform ${DURATION}s ease`;
	nextRef.value.style.transition = `transform ${DURATION}s ease`;
	preRef.value.style.transform = 'translateY(-100%)';
	nextRef.value.style.transform = '';

	switchCleanup = onTransitionEnd;
	preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
	nextRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 覆盖切入：新图从右侧滑入覆盖旧图，旧图静止不动 */
function cover(){
	prevSrc.value = preBackSrc;
	nextSrc.value = nextBackSrc;
	currentSrc.value = nextBackSrc;

	nextRef.value.style.transition = 'none';
	nextRef.value.style.transform = 'translateX(100%)';
	nextRef.value.style.opacity = '1';
	preRef.value.style.transition = 'none';
	preRef.value.style.transform = '';
	preRef.value.style.opacity = '1';
	void nextRef.value.offsetHeight;

	// 提升新图层级覆盖在旧图上方
	nextRef.value.style.zIndex = '3';

	nextRef.value.style.transition = `transform ${DURATION}s ease`;
	nextRef.value.style.transform = '';

	switchCleanup = onTransitionEnd;
	nextRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 缩放淡出：旧图放大并淡出，新图直接显示 */
function zoomOut(){
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

	preRef.value.style.transition = `opacity ${DURATION}s ease, transform ${DURATION}s ease`;
	preRef.value.style.transform = 'scale(1.15)';
	preRef.value.style.opacity = '0';

	switchCleanup = onTransitionEnd;
	preRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 对焦过渡：旧图瞬间隐藏，新图从模糊渐变为清晰 */
function focus(){
	prevSrc.value = preBackSrc;
	nextSrc.value = nextBackSrc;
	currentSrc.value = nextBackSrc;

	// 旧图立即隐藏
	preRef.value.style.transition = 'none';
	preRef.value.style.transform = '';
	preRef.value.style.filter = '';
	preRef.value.style.opacity = '0';
	// 新图初始模糊
	nextRef.value.style.transition = 'none';
	nextRef.value.style.transform = '';
	nextRef.value.style.filter = 'blur(8px)';
	nextRef.value.style.opacity = '1';
	void preRef.value.offsetHeight;

	// 新图渐变为清晰
	nextRef.value.style.transition = `filter ${DURATION}s ease`;
	nextRef.value.style.filter = '';

	switchCleanup = onTransitionEnd;
	nextRef.value.addEventListener('transitionend', onTransitionEnd, { once: true });
}
/** 随机选择一种动画效果执行 */
function random(){
	let animationList = ['fade','slideLeft','slideUp','zoomOut','focus','cover'];
	let index = Math.round((animationList.length - 1) * Math.random());
	chooseAnimation(animationList[index]);
}
/** 根据配置名称派发对应的动画 */
function chooseAnimation(value){
	switch(value){
		case 'fade':
			fade();
			break;
		case 'slideLeft':
			slideLeft();
			break;
		case 'slideUp':
			slideUp();
			break;
		case 'zoomOut':
			zoomOut();
			break;
		case 'focus':
			focus();
			break;
		case 'cover':
			cover();
			break;
		case 'random':
			random();
			break;
		default :
			fade();
	}
}
/** 统一动画入口：清理旧动画→首次黑暗淡入→派发切换动画 */
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
	preRef.value.style.filter = '';
	nextRef.value.style.filter = '';
	nextRef.value.style.zIndex = '';
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
}

// ==================== 幻灯片控制 ====================

/** 切换幻灯片：首次优先恢复本地记录，后续随机获取新壁纸 */
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

	/** 从 Wallpaper Engine 或本地样本中随机获取一张壁纸 */
	async function getWallpaperFilePath(){
		// 公共处理：预加载 → 保存 → 切换
		const processFile = async (filePath) => {
			await preloadImage(filePath);
			saveWallpaperFileInfo(filePath);
			if(nextBackSrc){
				preBackSrc = nextBackSrc;
			}
			nextBackSrc = filePath;
			handler();
		};

		if (process.env.NODE_ENV === 'production') {
			return new Promise((resolve,reject) => {
				window.wallpaperRequestRandomFileForProperty('fileDirectory',async (propertyName, filePath) => {
					if(filePath){
						filePath = 'file:///' + filePath;
						console.log('filePath',filePath);
						await processFile(filePath);
					} else {
						console.log('未获取到壁纸文件！');
					}
				});
			})
		} else if (process.env.NODE_ENV === 'development') {
			// 动态导入，生产构建时会被 tree-shake 移除
			const picsList = (await import('../../../samples/backgroundImages')).default;
			let index = Math.round((picsList.length - 1) * Math.random());
			let filePath = picsList[index];
			console.log('index',index);
			console.log('filePath',filePath);
			if(filePath){
				await processFile(filePath);
			} else {
				console.log('未检测到壁纸文件！');
			}
		}
	}

}
/** 初始化幻灯片定时器：延迟后首次切换并启动定时轮播 */
function initSlide() {
	if(!fileDirectory.value){
		console.log('未检测到文件目录！');
		return;
	}
	if(initDelayTimer){
		clearTimeout(initDelayTimer)
	}
	initDelayTimer = setTimeout(() => {
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
/** 销毁幻灯片：清除所有定时器、动画监听和图片状态 */
function destroySlide() {
	if(initDelayTimer){
		clearTimeout(initDelayTimer);
		initDelayTimer = null;
	}
	if(timer){
		clearInterval(timer);
		timer = null;
	}
	if(switchTimer){
		clearTimeout(switchTimer);
		switchTimer = null;
	}
	if(switchCleanup){
		preRef.value?.removeEventListener('transitionend', switchCleanup);
		nextRef.value?.removeEventListener('transitionend', switchCleanup);
		switchCleanup = null;
	}
	preRef.value.style.opacity = '';
	nextRef.value.style.opacity = '';
	currentRef.value.style.opacity = '';
	preRef.value.style.filter = '';
	nextRef.value.style.filter = '';
	currentRef.value.style.filter = '';
	preRef.value.style.transition = '';
	nextRef.value.style.transition = '';
	currentRef.value.style.transition = '';
	firstIn = true;
	currentSrc.value = '';
	preBackSrc = '';
	nextBackSrc = '';
}

// ==================== 视频控制 ====================

/** 创建并初始化视频播放器 */
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
/** 销毁视频播放器：停止播放并移除 DOM 元素 */
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

// ==================== 外部接口 ====================

/** 外部初始化入口：由父组件在 onMounted 时调用 */
function init() {
	console.log('初始化背景层');
	if(backgroundType.value === 'slide'){
		initSlide();
	}
	
}
/** 外部销毁入口：由父组件在 onUnmounted 时调用 */
function destroy() {
	console.log('销毁背景层');
	destroySlide();
	destroyPlayer();
}
/** 手动切换下一张壁纸（由父组件按钮触发） */
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

// ==================== 生命周期 & 监听 ====================

/** 背景类型变更时切换对应模块（幻灯片/视频/静态图） */
async function handleBackgroundTypeChange(val) {
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
				// 动态导入，生产构建时会被 tree-shake 移除
				const picsList = (await import('../../../samples/backgroundImages')).default;
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
}
/** 幻灯片切换间隔变化时重启轮播 */
function handleDurationChange(val) {
	console.log('持续时间改变',val);
	initSlide();
}
/** 壁纸目录变化时重新初始化幻灯片 */
function handleFileDirectoryChange(val) {
	console.log('文件目录改变',val);
	initSlide();
}
/** 视频文件路径变化时重新加载或销毁播放器 */
function handleVideoFilePathChange(val) {
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
}
/** 视频音量变化时同步更新 */
function handleVideoVolumeChange(val) {
	console.log('视频音量改变',val);
	if(player){
		player.volume = val;
	}	
}
/** 切换动画效果改变时重置过渡状态并重启幻灯片 */
function handleSwitchAnimationChange(val) {
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
	preRef.value.style.filter = '';
	nextRef.value.style.filter = '';
	preRef.value.style.opacity = '';
	nextRef.value.style.opacity = '';
	void preRef.value.offsetHeight;
	preRef.value.style.transition = '';
	nextRef.value.style.transition = '';
	initSlide();
}
onMounted(() => {
	watch(backgroundType, handleBackgroundTypeChange);
	watch(duration, handleDurationChange);
	watch(fileDirectory, handleFileDirectoryChange);
	watch(videoFilePath, handleVideoFilePathChange);
	watch(videoVolume, handleVideoVolumeChange);
	watch(switchAnimation, handleSwitchAnimationChange);
})
</script>

<style lang="less" scoped>
/** 隐藏空 src 或加载失败的 img，防止显示破损图标 */
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
