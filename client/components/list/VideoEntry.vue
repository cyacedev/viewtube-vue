<template>
  <div class="video-entry">
    <div
      v-if="video.author"
      class="video-author"
      :class="{
        thumbnail:
          (video.authorThumbnails && video.authorThumbnails.length > 0) ||
          (video.author && video.author.bestAvatar) ||
          video.authorThumbnailUrl
      }"
    >
      <nuxt-link
        :to="{ path: '/channel/' + (video.authorId ? video.authorId : video.author.channelID) }"
      >
        <img
          v-if="video.authorThumbnails && video.authorThumbnails.length > 0"
          class="author-thumbnail"
          :src="
            imgProxyUrl +
            (video.authorThumbnails[1]
              ? video.authorThumbnails[1].url
              : video.authorThumbnails[0].url)
          "
          alt="Author thumbnail"
        />
        <img
          v-else-if="video.authorThumbnailUrl"
          class="author-thumbnail"
          :src="apiUrl + video.authorThumbnailUrl"
          alt="Author thumbnail"
        />
        <img
          v-else-if="video.author && video.author.bestAvatar"
          class="author-thumbnail"
          :src="imgProxyUrl + video.author.bestAvatar.url"
          alt="Author thumbnail"
        />
      </nuxt-link>
      <div class="channel-name-container">
        <nuxt-link
          v-tippy="video.author.name ? video.author.name : video.author"
          class="video-entry-channel"
          :to="{ path: '/channel/' + (video.authorId ? video.authorId : video.author.channelID) }"
          >{{ video.author.name ? video.author.name : video.author }}</nuxt-link
        >
        <VerifiedIcon
          v-if="(video.author && video.author.verified) || video.authorVerified"
          v-tippy="'Verified'"
          class="tooltip"
          title=""
        />
      </div>
    </div>
    <div class="video-entry-background" />
    <div v-if="video.description" class="description-btn-container">
      <div v-ripple v-tippy="'Show description'" class="description-btn">
        <InfoIcon />
      </div>
    </div>
    <input v-if="video.description" id="show-description" type="checkbox" name="show-description" />
    <nuxt-link
      v-tippy="videoProgressTooltip"
      class="video-entry-thmb"
      :to="{
        name: 'watch',
        query: { v: video.videoId ? video.videoId : video.id },
        params: { videoData: video }
      }"
      :class="{ 'has-description': video.description }"
    >
      <div class="thmb-image-container">
        <div class="thmb-clip">
          <img
            class="video-entry-thmb-image"
            :loading="lazy ? 'lazy' : 'eager'"
            :src="videoThumbnailUrl"
            :srcset="`
              ${videoThumbnailUrl} 1x, 
              ${videoThumbnailUrl} 2x, 
              ${videoThumbnailUrlXL} 3x, 
              ${videoThumbnailUrlXL} 4x
            `"
            :alt="video.title"
          />
        </div>
        <div v-if="video.description" class="video-description-overlay">
          <p>{{ video.description }}</p>
        </div>
      </div>
      <div v-if="video.isLive" class="video-live">
        <svg
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet"
          focusable="false"
          class="live-icon"
          fill="#fff"
        >
          <g>
            <path
              d="M16.94 6.9l-1.4 1.46C16.44 9.3 17 10.58 17 12s-.58 2.7-1.48 3.64l1.4 1.45C18.22 15.74 19 13.94 19 12s-.8-3.8-2.06-5.1zM23 12c0-3.12-1.23-5.95-3.23-8l-1.4 1.45C19.97 7.13 21 9.45 21 12s-1 4.9-2.64 6.55l1.4 1.45c2-2.04 3.24-4.87 3.24-8zM7.06 17.1l1.4-1.46C7.56 14.7 7 13.42 7 12s.6-2.7 1.5-3.64L7.08 6.9C5.78 8.2 5 10 5 12s.8 3.8 2.06 5.1zM1 12c0 3.12 1.23 5.95 3.23 8l1.4-1.45C4.03 16.87 3 14.55 3 12s1-4.9 2.64-6.55L4.24 4C2.24 6.04 1 8.87 1 12zm9-3.32v6.63l5-3.3-5-3.3z"
            />
          </g>
        </svg>
        <span class="live-text">Live</span>
      </div>
      <div class="video-saved-progress" :style="{ width: `${videoProgressPercentage}%` }" />
      <span v-if="video.lengthSeconds" class="video-entry-length">{{
        $formatting.getTimestampFromSeconds(video.lengthSeconds)
      }}</span>
      <span v-if="video.lengthString" class="video-entry-length">{{ video.lengthString }}</span>
      <span v-if="video.duration" class="video-entry-length">{{ video.duration }}</span>
    </nuxt-link>

    <div class="video-entry-info">
      <div class="video-info-text">
        <nuxt-link
          v-tippy="video.title"
          class="video-entry-title"
          :to="{
            name: 'watch',
            query: { v: video.videoId ? video.videoId : video.id },
            params: { videoData: video }
          }"
          >{{ video.title }}</nuxt-link
        >
        <div class="video-entry-stats">
          <p v-if="video.viewCount" class="video-entry-views">
            {{ video.viewCount.toLocaleString('en-US') }}
            {{ video.viewCount === 1 ? 'view' : 'views' }}
          </p>
          <p v-if="video.views" class="video-entry-views">
            {{ video.views.toLocaleString('en-US') }}
            {{ video.views === 1 ? 'view' : 'views' }}
          </p>
          <p class="video-entry-timestamp">
            {{ video.publishedText ? video.publishedText : video.uploadedAt }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import InfoIcon from 'vue-material-design-icons/Information.vue';
import VerifiedIcon from 'vue-material-design-icons/CheckDecagram.vue';
// import { getSecondsFromTimestamp } from '@/plugins/shared';
import { computed, defineComponent, ref } from '@nuxtjs/composition-api';
import { useImgProxy } from '@/plugins/proxy';
import { useAccessor } from '@/store';
// import { useFormatting } from '@/plugins/formatting';

export default defineComponent({
  name: 'VideoEntry',
  components: {
    InfoIcon,
    VerifiedIcon
  },
  props: {
    video: Object,
    lazy: Boolean
  },
  setup(props) {
    const imgProxy = useImgProxy();
    const accessor = useAccessor();
    // const formatting = useFormatting();

    const localProxy = '&local=true';

    const apiUrl = ref('/');
    const videoThumbnailUrl = ref(null);

    apiUrl.value = accessor.environment.apiUrl;

    if (props.video.videoThumbnails) {
      videoThumbnailUrl.value = imgProxy.url + props.video.videoThumbnails[3].url + localProxy;
    } else if (props.video.thumbnails) {
      if (props.video.thumbnails[1]) {
        videoThumbnailUrl.value = imgProxy.url + props.video.thumbnails[1].url + localProxy;
      } else {
        videoThumbnailUrl.value = imgProxy.url + props.video.thumbnails[0].url + localProxy;
      }
    }

    const videoThumbnailUrlXL = ref('');
    if (props.video.videoThumbnails) {
      videoThumbnailUrlXL.value = imgProxy.url + props.video.videoThumbnails[2].url + localProxy;
    } else if (props.video.thumbnails) {
      if (props.video.thumbnails[0]) {
        videoThumbnailUrlXL.value = imgProxy.url + props.video.thumbnails[0].url + localProxy;
      }
    }
    const videoProgressPercentage = computed((): number => {
      // const savedPosition = accessor.videoProgress.getSavedPositionForId(
      //   props.video.videoId ? props.video.videoId : props.video.id
      // );
      // if (props.video.duration) {
      //   const videoLength = props.video.lengthSeconds
      //     ? props.video.lengthSeconds
      //     : getSecondsFromTimestamp(props.video.duration);
      //   return (savedPosition / videoLength) * 100;
      // }
      return 0;
    });

    const videoProgressTooltip = computed((): string => {
      // const savedPosition = accessor.videoProgress.getSavedPositionForId(
      //   props.video.videoId ? props.video.videoId : props.video.id
      // );
      // if (savedPosition && props.video.duration) {
      //   const timestampSeconds = getSecondsFromTimestamp(props.video.duration);
      //   const watchTime = formatting.getTimestampFromSeconds(savedPosition);
      //   const totalTime = formatting.getTimestampFromSeconds(
      //     props.video.lengthSeconds ? props.video.lengthSeconds : timestampSeconds
      //   );
      //   if (videoProgressPercentage.value > 0) {
      //     return `${watchTime} of ${totalTime}`;
      //   }
      // }
      return null;
    });

    return {
      imgProxyUrl: imgProxy.url,
      videoThumbnailUrl,
      videoThumbnailUrlXL,
      videoProgressPercentage,
      videoProgressTooltip,
      apiUrl
    };
  }
});
</script>

<style lang="scss">
.video-entry {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  z-index: 11;
  position: relative;
  min-height: 0;

  .video-author {
    padding: 0;
    height: 42px;

    &.thumbnail {
      display: flex;
      flex-direction: row;

      .channel-name-container {
        .material-design-icon {
          margin: 6px 0 0 4px;
        }
      }
    }

    .author-thumbnail {
      width: 36px;
      height: 36px;
      margin: 0 10px 0 0;
      border-radius: 25px;
    }

    .channel-name-container {
      display: flex;
      flex-direction: row;
      height: 100%;

      .video-entry-channel {
        text-decoration: none;
        padding: 10px 0 4px 0;

        font-size: 0.85rem;
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--subtitle-color);
      }

      .material-design-icon {
        width: 14px;
        height: 14px;
        top: 3px;
        margin: 0 0 0 4px;

        .material-design-icon__svg {
          width: 14px;
          height: 14px;
        }
      }
    }
  }

  .video-entry-background {
    position: absolute;
    top: 10px;
    left: 10px;
    // background-color: #34363b;
    z-index: 10;
    transition-duration: 300ms;
    transition-timing-function: $intro-easing;
    transition-property: box-shadow;
  }

  &:hover {
    .description-btn-container {
      opacity: 1;
      transform: scale(1);
    }
  }

  .description-btn-container {
    position: absolute;
    top: 38px;
    right: 0;
    z-index: 12;
    width: 44px;
    height: 44px;
    padding: 10px;
    margin: 5px;
    opacity: 0;
    transform: scale(0.8);
    background-color: $video-thmb-overlay-bgcolor;
    border-radius: 5px;
    box-sizing: border-box;
    cursor: pointer;
    transition: opacity 200ms $intro-easing, transform 200ms $intro-easing;
  }

  #show-description {
    position: absolute;
    top: 38px;
    right: 2px;
    z-index: 13;
    opacity: 0;
    width: 50px;
    height: 50px;
    cursor: pointer;
  }

  #show-description:checked + .video-entry-thmb .video-entry-length {
    transform: scale(0);
  }

  #show-description:checked + .video-entry-thmb .thmb-image-container .video-description-overlay {
    opacity: 1;
  }

  .video-entry-thmb {
    position: relative;
    z-index: 11;
    box-shadow: $medium-shadow;
    overflow: hidden;
    padding-top: 56.25%;
    border-radius: 8px;
    transition: transform 300ms $intro-easing;

    &:hover {
      transform: scale(1.02);
    }

    &:focus {
      transform: scale(1.05);
    }

    .thmb-image-container {
      position: absolute;
      width: 100%;
      top: 50%;
      left: 0;
      transform: translateY(-50%);

      .thmb-clip {
        overflow: hidden;

        .video-entry-thmb-image {
          display: block;
          max-width: 100%;
          min-width: 100%;
          transition: filter 0ms 300ms $intro-easing;
        }
      }

      .video-description-overlay {
        pointer-events: none;
        color: $video-thmb-overlay-textcolor;
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: #0000009f;
        padding: 10px;
        overflow: hidden;
        box-sizing: border-box;
        font-size: 1rem;
        opacity: 0;
        transition: opacity 200ms $intro-easing;

        p {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
      }
    }

    .video-live {
      text-decoration: none;
      color: $video-thmb-overlay-textcolor;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      padding: 5px 12px;
      background-color: $video-thmb-overlay-bgcolor;
      box-sizing: border-box;
      border-radius: 5px;
      font-family: $default-font;
      display: flex;
      flex-direction: row;
      align-items: center;

      .live-text {
        margin: 0 0 0 10px;
      }

      .live-icon {
        width: 36px;
        height: 36px;

        .material-design-icon__svg {
          width: 36px;
          height: 36px;
        }
      }
    }

    .video-saved-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background-color: var(--theme-color);
      max-width: 100%;
    }

    .video-entry-length {
      text-decoration: none;
      color: $video-thmb-overlay-textcolor;
      position: absolute;
      right: 0;
      bottom: 0;
      padding: 2px 4px;
      margin: 8px 4px;
      background-color: $video-thmb-overlay-bgcolor;
      box-sizing: border-box;
      border-radius: 2px;
      font-family: $default-font;
      transition: transform 200ms $intro-easing;
    }
  }

  .video-entry-info {
    padding: 0 0 5px 0;
    font-family: $default-font;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: left;
    z-index: 11;

    .video-info-text {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      width: 100%;

      .video-entry-title {
        text-decoration: none;
        margin: 0;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--title-color);
        padding: 8px 0 4px 0;
        width: 100%;
        box-sizing: border-box;
      }

      .video-entry-stats {
        color: var(--subtitle-color-light);
        display: flex;
        width: 100%;
        justify-content: space-between;
        flex-direction: row;
        font-size: 0.8rem;
        margin: 0 0 0 0;
      }
    }
  }

  // @media screen and (max-width: $mobile-width) {
  //   width: calc(100% - 20px);
  //   padding: 10px;

  //   .video-entry-thmb {
  //     width: 100%;
  //     height: 53vw;

  //     &:hover.has-description {
  //       .thmb-image-container {
  //         transform: rotateY(180deg) translateY(0);
  //         .thmb-clip {
  //           .video-entry-thmb-image {
  //             filter: blur(5px);
  //           }
  //         }
  //       }
  //       .video-entry-length {
  //         transform: scale(0);
  //       }
  //     }

  //     .thmb-image-container {
  //       position: relative;
  //       top: 0;
  //       left: 0;
  //       transform: translateY(0);

  //       .thmb-clip {
  //         height: 53vw;

  //         .video-entry-thmb-image {
  //           top: 0;
  //           transform: translateY(0px);
  //         }
  //       }
  //     }
  //   }
  // }
}
</style>
