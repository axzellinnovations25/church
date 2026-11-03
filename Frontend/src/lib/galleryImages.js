import { getBackendUrl } from './auth'
import { siteImageUrl } from './siteImages'

const publicAsset = siteImageUrl
export const galleryImages = [
  {
    src: publicAsset('gallery/IMG_5236 (1).jpeg'),
    title: 'Pieta Statue',
    caption: 'A devotional statue displayed inside the cathedral.',
  },
  {
    src: publicAsset('gallery/IMG_6047.jpeg'),
    title: 'Nave Entrance',
    caption: 'Looking towards the main doors from inside the church.',
  },
  {
    src: publicAsset('gallery/IMG_4020.jpeg'),
    title: 'Parish Noticeboard',
    caption: 'Community notices and information displayed near the entrance.',
  },
  {
    src: publicAsset('gallery/IMG_4300.jpeg'),
    title: 'Welcome Area',
    caption: 'A welcoming space with leaflets, information, and parish materials.',
  },
  {
    src: publicAsset('gallery/IMG_5235.jpeg'),
    title: 'Stained Glass Panel',
    caption: 'A stained glass panel inside the cathedral.',
  },
  {
    src: publicAsset('gallery/IMG_3836.jpeg'),
    title: 'Book of Condolence for Pope Francis',
    caption: 'The Cathedral book of condolence and memorial display for Pope Francis.',
  },
  {
    src: publicAsset('gallery/thumbnail_IMG_7226.jpg'),
    title: 'Music at Mass',
    caption: 'Live music during a liturgy.',
  },
  {
    src: publicAsset('gallery/Eisteddfod Cytun tent.JPG'),
    title: 'Parish Volunteers',
    caption: 'Volunteers supporting a parish event.',
  },
  {
    src: publicAsset('gallery/IMG_4301.jpeg'),
    title: 'Cathedral Entrance',
    caption: 'Outside the main entrance on a busy parish day.',
  },
  {
    src: publicAsset('gallery/IMG_4043.jpeg'),
    title: 'Civic Guests at the Cathedral',
    caption: 'Civic representatives and guests welcomed at the Cathedral entrance.',
  },
  {
    src: publicAsset('gallery/IMG_4144.jpeg'),
    title: 'Discover Network Sign',
    caption: 'Information about the church network and local area.',
  },
  {
    src: publicAsset('gallery/IMG_5237.jpeg'),
    title: 'Saint Richard Gwyn Artwork',
    caption: 'Artwork depicting Saint Richard Gwyn and scenes from his story.',
  },
  {
    src: publicAsset('gallery/IMG_5234.jpeg'),
    title: 'Icon of Our Lady of Częstochowa',
    caption: 'The Polish icon of Our Lady of Częstochowa displayed in the Cathedral.',
  },
  {
    src: publicAsset('gallery/IMG_5238.jpeg'),
    title: 'Our Lady of Sorrows and Saint Richard Gwyn Chapel',
    caption: 'The bilingual plaque explaining the chapel, its Pietà and its connection with Saint Richard Gwyn.',
  },
  {
    src: publicAsset('gallery/bc306027-0afa-411b-9e3a-49be6c553f45 Santo Nino.jfif'),
    title: 'Santo Nino Display',
    caption: 'A devotional display in the cathedral.',
  },
]

function normalizeBackendGalleryImage(item) {
  return {
    src: getBackendUrl(item.image_url),
    title: item.title,
    caption: item.caption || '',
  }
}

export async function fetchGalleryImages() {
  try {
    const response = await fetch(getBackendUrl('/api/v1/gallery-images'), {
      headers: {
        Accept: 'application/json',
      },
    })
    const payload = await response.json()

    if (!response.ok || !Array.isArray(payload.data) || payload.data.length === 0) {
      return galleryImages
    }

    const backendImages = payload.data
      .filter(item => item.image_url && item.title)
      .map(normalizeBackendGalleryImage)

    return backendImages.length ? backendImages : galleryImages
  } catch {
    return galleryImages
  }
}
