import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import PageHero from '../components/PageHero'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import PhotoGallery from '../components/PhotoGallery'
import { galleryImages } from '../lib/galleryImages'
import { publicQueries } from '../lib/publicData'
import './GalleryPage.css'

export default function GalleryPage() {
  const { data: publicGalleryImages = galleryImages } = useQuery(publicQueries.gallery)

  return (
    <div className="gallery-page">
      <PageHero
        title="Photo Gallery"
        subtitle="A glimpse of parish life, worship, and the cathedral building"
      />

      <Section>
        <Container>
          <div className="gallery-page-head">
            <div className="gallery-page-kicker">Highlights</div>
            <div className="gallery-page-actions">
              <Link className="btn-outline" to="/contact">Visit Us</Link>
              <Link className="btn-gold" to="/parish-groups">Join a Group</Link>
            </div>
          </div>

          <PhotoGallery images={publicGalleryImages} />
        </Container>
      </Section>
    </div>
  )
}
