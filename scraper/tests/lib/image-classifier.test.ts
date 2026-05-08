import { describe, it, expect } from 'vitest'
import { classifyImage } from '../../src/lib/image-classifier'

describe('classifyImage', () => {
  it('returns front_label for index 0 with no alt text', () => {
    expect(classifyImage('https://example.com/img.jpg', '', 0)).toBe('front_label')
  })

  it('returns nutrition_panel when alt contains "nutrition facts"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Nutrition Facts Panel', 1)).toBe('nutrition_panel')
  })

  it('returns nutrition_panel when alt contains "supplement facts"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Supplement Facts', 2)).toBe('nutrition_panel')
  })

  it('returns ingredients_panel when alt contains "ingredients"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Ingredients list', 1)).toBe('ingredients_panel')
  })

  it('returns back_label when alt contains "back"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Product Back View', 2)).toBe('back_label')
  })

  it('returns back_label when alt contains "rear"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Rear panel', 3)).toBe('back_label')
  })

  it('returns claims_panel when alt contains "warning"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Warning label', 2)).toBe('claims_panel')
  })

  it('returns claims_panel when alt contains "allergen"', () => {
    expect(classifyImage('https://example.com/img.jpg', 'Allergen declaration', 3)).toBe('claims_panel')
  })

  it('returns unknown when no signal matches and index > 0', () => {
    expect(classifyImage('https://example.com/lifestyle.jpg', 'Happy customer', 1)).toBe('unknown')
  })

  it('is case insensitive', () => {
    expect(classifyImage('https://example.com/img.jpg', 'NUTRITION FACTS', 1)).toBe('nutrition_panel')
  })
})
