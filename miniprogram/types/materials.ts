export type MaterialsFilterId = 'all' | 'image' | 'video' | 'pdf'

export interface MaterialsFilterViewModel {
  id: MaterialsFilterId
  label: string
}

export interface MaterialCardViewModel {
  id: string
  title: string
  date: string
  thumbnailUrl: string
  kind: Exclude<MaterialsFilterId, 'all'>
  isDraft?: boolean
}

export interface MaterialDetailViewModel {
  id: string
  title: string
  images: string[]
  descriptionLines: string[]
}

export interface MaterialsViewModel {
  filters: MaterialsFilterViewModel[]
  items: MaterialCardViewModel[]
}

export interface PublishImageViewModel {
  id: string
  path: string
}

export interface MaterialDraftEditViewModel {
  id: string
  images: PublishImageViewModel[]
  copy: string
}
