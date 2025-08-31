import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import FavoritesCart from '../../../components/FavoritesCart'
import { useFavorites } from '../../../components/FavoritesContext'
import { useCurrency } from '../../../components/CurrencyContext'

// Mock the context hooks
vi.mock('../../../components/FavoritesContext')
vi.mock('../../../components/CurrencyContext')

const mockUseFavorites = vi.mocked(useFavorites)
const mockUseCurrency = vi.mocked(useCurrency)

// Mock the ImageWithFallback component
vi.mock('../../../components/figma/ImageWithFallback', () => ({
  ImageWithFallback: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  )
}))

const mockTour = {
  id: 1,
  title: 'Test Tour',
  description: 'A test tour description',
  duration: '2 hours',
  max_group_size: 10,
  price_per_person: 50,
  image_urls: ['test-image.jpg'],
  rating: 4.8
}

describe('FavoritesCart', () => {
  const mockOnViewTourDetails = vi.fn()
  const mockOnBookNow = vi.fn()
  const mockRemoveFromFavorites = vi.fn()
  const mockClearFavorites = vi.fn()
  const mockFormatPrice = vi.fn((price) => `$${price}`)

  beforeEach(() => {
    mockUseCurrency.mockReturnValue({
      formatPrice: mockFormatPrice
    } as any)

    vi.clearAllMocks()
  })

  it('shows empty state when no favorites', () => {
    mockUseFavorites.mockReturnValue({
      favorites: [],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Should show cart icon with no badge
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })

  it('shows cart badge when has favorites', () => {
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Should show cart icon with badge showing count
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('opens cart sheet when clicked', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Click the cart button
    await user.click(screen.getByRole('button'))
    
    // Should show the sheet content
    expect(screen.getByText('Saved Tours')).toBeInTheDocument()
    expect(screen.getByText('Test Tour')).toBeInTheDocument()
  })

  it('handles view tour action', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Open the cart
    await user.click(screen.getByRole('button'))
    
    // Click view button
    await user.click(screen.getByText('View'))
    
    expect(mockOnViewTourDetails).toHaveBeenCalledWith(mockTour)
  })

  it('handles book tour action', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Open the cart
    await user.click(screen.getByRole('button'))
    
    // Click book button
    await user.click(screen.getByText('Book'))
    
    expect(mockOnBookNow).toHaveBeenCalledWith(mockTour)
  })

  it('handles remove from favorites', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Open the cart
    await user.click(screen.getByRole('button'))
    
    // Find all buttons and look for the one with Trash2 icon in the tour card
    const buttons = screen.getAllByRole('button')
    // The remove button should be the small one in the tour card (not the "Clear all" button)
    const removeButton = buttons.find(btn => 
      btn.getAttribute('class')?.includes('h-6 w-6 p-0') && 
      btn.getAttribute('class')?.includes('hover:text-destructive')
    )
    
    expect(removeButton).toBeTruthy()
    if (removeButton) {
      await user.click(removeButton)
      expect(mockRemoveFromFavorites).toHaveBeenCalledWith(mockTour.id)
    }
  })

  it('handles clear all favorites', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Open the cart
    await user.click(screen.getByRole('button'))
    
    // Click clear all button
    await user.click(screen.getByText('Clear all'))
    
    expect(mockClearFavorites).toHaveBeenCalled()
  })

  it('displays tour information correctly', async () => {
    const user = userEvent.setup()
    
    mockUseFavorites.mockReturnValue({
      favorites: [mockTour],
      removeFromFavorites: mockRemoveFromFavorites,
      clearFavorites: mockClearFavorites
    } as any)

    render(
      <FavoritesCart 
        onViewTourDetails={mockOnViewTourDetails}
        onBookNow={mockOnBookNow}
      />
    )

    // Open the cart first
    await user.click(screen.getByRole('button'))

    // Now the tour details should be in the document
    expect(screen.getByText('Test Tour')).toBeInTheDocument()
    expect(screen.getByText('2 hours')).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    
    // Price should be formatted
    expect(mockFormatPrice).toHaveBeenCalledWith(50)
  })
})