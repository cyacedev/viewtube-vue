import { ChannelLinkDto } from './dto/channel-link.dto';
import { ChannelDto } from './dto/channel.dto';
import { VideoBasicInfoDto } from '../videos/dto/video-basic-info.dto';
import { Common } from '../common';
import { ChannelBasicInfoDto } from './dto/channel-basic-info.dto';

export class ChannelMapper {
  static mapChannel(source: any, aboutSource: any): ChannelDto {
    const tabData = aboutSource.contents.twoColumnBrowseResultsRenderer.tabs;
    const aboutTabData = tabData.find(el => el.tabRenderer.title === 'About');
    const homeTabData = source.contents.twoColumnBrowseResultsRenderer.tabs.find(
      el => el.tabRenderer.title === 'Home'
    );
    const metadata = source.metadata.channelMetadataRenderer;
    const header = source.header.c4TabbedHeaderRenderer;

    const author = this.multiValue([metadata.title, header.title]);
    const authorId = this.multiValue([header.channelId, metadata.externalId]);
    const authorUsername = this.multiValue([
      metadata.ownerUrls[0],
      header.navigationEndpoint.commandMetadata.webCommandMetadata.url
        .replace('/c/', '')
        .replace('/u/', '')
    ]);
    const allowedRegions = metadata.availableCountryCodes;
    let authorBanners = [];
    if (header.banner) {
      authorBanners = this.mapBanners(header.banner.thumbnails);
    }
    let authorThumbnails = [];
    if (header.avatar) {
      authorThumbnails = header.avatar.thumbnails;
    }
    const authorUrl = `https://youtube.com/channel/${authorId}`;

    // I don't know what properties the following two would be
    const autoGenerated = false;
    const paid = false;
    let channelLinks = [];
    if (header.headerLinks && header.headerLinks.channelHeaderLinksRenderer) {
      channelLinks = this.mapChannelLinks(
        header.headerLinks.channelHeaderLinksRenderer.primaryLinks
      );
    }
    const descriptionHtml = null;
    const isFamilyFriendly = metadata.isFamilySafe;
    let joined = null;
    let totalViews = null;
    let description = '';
    if (aboutTabData && aboutTabData.tabRenderer.content.sectionListRenderer.contents[0]) {
      try {
        const fullMetadata =
          aboutTabData.tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer
            .contents[0].channelAboutFullMetadataRenderer;
        joined = fullMetadata.joinedDateText.runs[1].text;
        description = fullMetadata.description.simpleText;
        totalViews = fullMetadata.viewCountText.simpleText
          .replace('views', '')
          .replace(',', '')
          .trim();
      } catch (_) {}
    }
    const videoSections = this.mapVideoSections(
      homeTabData.tabRenderer.content.sectionListRenderer.contents,
      { author, authorId }
    );
    let channelSection = null;
    if (source.contents.twoColumnBrowseResultsRenderer.secondaryContents) {
      channelSection =
        source.contents.twoColumnBrowseResultsRenderer.secondaryContents
          .browseSecondaryContentsRenderer.contents;
    }
    let relatedChannels = [];
    if (channelSection) {
      relatedChannels = this.mapRelatedChannels(channelSection);
    }
    let subCount = null;
    if (header.subscriberCountText) {
      subCount = this.parseAbbreviatedNumber(
        header.subscriberCountText.runs[0].text.replace('subscribers', '').trim()
      );
    }

    const channel: ChannelDto = {
      author,
      authorId,
      authorUsername,
      allowedRegions,
      authorBanners,
      authorThumbnails,
      authorUrl,
      autoGenerated,
      description,
      descriptionHtml,
      isFamilyFriendly,
      joined,
      videoSections,
      paid,
      relatedChannels,
      subCount,
      totalViews,
      channelLinks
    };

    return channel;
  }

  static multiValue(valueArray: Array<any>): any {
    let definedValue: any = null;
    valueArray.forEach((el: any) => {
      if (el) {
        definedValue = el;
      }
    });
    return definedValue;
  }

  static mapRelatedChannels(
    source: any
  ): Array<{ title: string; channels: Array<ChannelBasicInfoDto> }> {
    return source
      .filter(el => el.verticalChannelSectionRenderer)
      .map(miniChannel => {
        const channelSource = miniChannel.verticalChannelSectionRenderer;
        const channels: Array<ChannelBasicInfoDto> = channelSource.items
          .filter(item => item.miniChannelRenderer)
          .map((element: any) => {
            const rawChannel = element.miniChannelRenderer;
            const mappedChannel: ChannelBasicInfoDto = {
              authorId: rawChannel.channelId,
              author: rawChannel.title.runs[0].text,
              authorThumbnails: rawChannel.thumbnail.thumbnails,
              subCount: this.parseAbbreviatedNumber(rawChannel.subscriberCountText.simpleText),
              videoCount: parseInt(
                rawChannel.videoCountText.runs[0].text.replace('videos', '').trim()
              )
            };
            return mappedChannel;
          });
        return {
          title: channelSource.title,
          channels
        };
      });
  }

  static parseAbbreviatedNumber(string: any) {
    const match = string
      .replace(',', '.')
      .replace(' ', '')
      .match(/([\d,.]+)([MK]?)/);
    if (match) {
      let [, num, multi] = match;
      num = parseFloat(num);
      return multi === 'M' ? num * 1000000 : multi === 'K' ? num * 1000 : num;
    }
    return null;
  }

  static mapVideoSections(
    source: Array<any>,
    channel: any
  ): Array<{
    title?: string;
    type: 'single' | 'multi';
    videos?: Array<VideoBasicInfoDto>;
    video?: VideoBasicInfoDto;
  }> {
    return source
      .filter(
        section =>
          section.itemSectionRenderer.contents.find((el: any) => el.shelfRenderer) ||
          section.itemSectionRenderer.contents.find((el: any) => el.channelVideoPlayerRenderer)
      )
      .map(section => {
        const shelfRendererSource = section.itemSectionRenderer.contents.find(
          (el: any) => el.shelfRenderer
        );
        const videoPlayerSource = section.itemSectionRenderer.contents.find(
          (el: any) => el.channelVideoPlayerRenderer
        );
        if (shelfRendererSource && shelfRendererSource.shelfRenderer) {
          console.log(shelfRendererSource.shelfRenderer.title);
          const title = shelfRendererSource.shelfRenderer.title.runs[0].text;
          const videos = this.mapSingleSectionVideos(
            shelfRendererSource.shelfRenderer.content.horizontalListRenderer.items,
            channel
          );
          return {
            type: 'multi',
            videos,
            title
          };
        } else if (videoPlayerSource && videoPlayerSource.channelVideoPlayerRenderer) {
          const video = this.mapVideoPlayerRendererVideo(
            videoPlayerSource.channelVideoPlayerRenderer,
            channel
          );
          return {
            type: 'single',
            video
          };
        }
        return null;
      });
  }

  static mapVideoPlayerRendererVideo(source: any, channel: any): VideoBasicInfoDto {
    const titleRun = source.title.runs[0];
    const title = titleRun.text;
    const videoId = titleRun.navigationEndpoint.watchEndpoint.videoId;
    const { viewCount, author, lengthSeconds, publishedText } = this.parseAccessibilityText(
      source.title.accessibility.accessibilityData.label,
      title
    );
    const videoThumbnails = Common.getVideoThumbnails(videoId);
    const description = this.concatDescriptionRuns(source.description.runs);

    return {
      author,
      authorId: channel.authorId,
      publishedText,
      title,
      videoId,
      videoThumbnails,
      viewCount,
      lengthSeconds,
      description
    };
  }

  static concatDescriptionRuns(descriptionRuns: Array<any>): string {
    let descriptionString = '';
    descriptionRuns.forEach(run => {
      if (run.navigationEndpoint) {
        descriptionString += this.cleanTrackingRedirect(run.navigationEndpoint.urlEndpoint.url);
      } else {
        descriptionString += run.text;
      }
    });
    return descriptionString;
  }

  static mapSingleSectionVideos(source: Array<any>, channel: any): Array<VideoBasicInfoDto> {
    return source.map(video => {
      if (video.gridVideoRenderer) {
        const vidRenderer = video.gridVideoRenderer;
        return this.mapSectionVideo(vidRenderer, channel);
      }
      return null;
    });
  }

  static mapSectionVideo(source: any, channel: any): VideoBasicInfoDto {
    const title = source.title.simpleText;
    let altPublishedText = null;
    if (source.publishedTimeText) {
      altPublishedText = source.publishedTimeText.simpleText;
    }
    let published = null;
    if (source.upcomingEventData) {
      published = source.upcomingEventData.startTime;
    }
    const videoId = source.navigationEndpoint.watchEndpoint.videoId;
    const videoThumbnails = Common.getVideoThumbnails(videoId);
    const { viewCount, author, lengthSeconds, publishedText } = this.parseAccessibilityText(
      source.title.accessibility.accessibilityData.label,
      title
    );

    if (!altPublishedText) {
      altPublishedText = publishedText;
    }

    return {
      title,
      author,
      authorId: channel.authorId,
      publishedText: altPublishedText,
      videoId,
      videoThumbnails,
      viewCount,
      lengthSeconds
    };
  }

  static parseAccessibilityText(
    text: string,
    videoName: string
  ): { author: string; lengthSeconds: number; publishedText: string; viewCount: number } {
    const viewCountRegex = /(\d+|\d{1,3}(,\d{3})*)(\.\d+)?\sviews?/i;
    const secondsRegex = /(\d{1,2})\sseconds?/i;
    const minutesRegex = /(\d{1,2})\sminutes?/i;
    const hoursRegex = /(\d{1,2})\shours?/i;
    const publishedTextRegex = /\d.*?ago/gi;
    const authorRegex = /by\s(.*)/i;

    const stringwithoutName = text.replace(videoName, '').trim();

    const viewCountMatch = stringwithoutName.match(viewCountRegex);
    const viewCountString = viewCountMatch ? viewCountMatch[1] : '';
    const viewCount = parseInt(viewCountString.replace(',', ''));
    let stringWithoutViews = stringwithoutName.replace(viewCountRegex, '').replace(',', '').trim();

    const secondsMatch = stringWithoutViews.match(secondsRegex);
    const seconds = secondsMatch ? parseInt(secondsMatch[1]) : 0;
    stringWithoutViews = stringWithoutViews.replace(secondsRegex, '').trim();

    const minutesMatch = stringWithoutViews.match(minutesRegex);
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    stringWithoutViews = stringWithoutViews.replace(minutesRegex, '').trim();

    const hoursMatch = stringWithoutViews.match(hoursRegex);
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    stringWithoutViews = stringWithoutViews.replace(hoursRegex, '').trim();

    const lengthSeconds = seconds + minutes * 60 + hours * 3600;

    const publishedTextMatch = stringWithoutViews.match(publishedTextRegex);
    const publishedText = publishedTextMatch ? publishedTextMatch[0] : null;
    stringWithoutViews = stringWithoutViews.replace(publishedTextRegex, '').trim();

    const authorMatch = stringWithoutViews.match(authorRegex);
    const author = authorMatch ? authorMatch[1] : null;

    return { author, lengthSeconds, publishedText, viewCount };
  }

  static mapChannelLinks(source: Array<any>): Array<ChannelLinkDto> {
    if (source) {
      return source.map(el => {
        return {
          title: el.title.simpleText,
          url: this.cleanTrackingRedirect(el.navigationEndpoint.urlEndpoint.url),
          linkThumbnails: el.icon.thumbnails.map(thmb => ({ url: `https://${thmb.url}` }))
        };
      });
    }
    return [];
  }

  static cleanTrackingRedirect(source: string): string {
    const encodedUrl = source.replace(/\/redirect.*?q=/gi, '').replace(/&.*/gi, '');
    return decodeURIComponent(encodedUrl);
  }

  static mapBanners(
    source: Array<{ url: string; width: number; height: number }>
  ): Array<{ url: string; width: number; height: number }> {
    return source.map(el => {
      return {
        url: `https:${el.url}`,
        height: el.height,
        width: el.width
      };
    });
  }
}
