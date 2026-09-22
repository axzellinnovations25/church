import { getBackendUrl } from './auth'

const publicAsset = (path) => encodeURI(`${import.meta.env.BASE_URL}${path}`)

// These images live in `Frontend/public/gallery/`.
// If a file is missing, the UI will fall back gracefully.
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
    title: 'Visitor Book',
    caption: 'A visitor book set out for parishioners and guests to sign.',
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
    title: 'Community Visit',
    caption: 'A special visit and community moment outside the cathedral.',
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
    title: 'Our Lady and Child Artwork',
    caption: 'A framed devotional image displayed in the cathedral.',
  },
  {
    src: publicAsset('gallery/IMG_5238.jpeg'),
    title: 'Chapel Information Plaque',
    caption: 'An information plaque describing the chapel and its history.',
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
