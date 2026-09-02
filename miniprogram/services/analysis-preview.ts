import { analysisContentDetailPreview, analysisOverviewPreview } from '../mocks/analysis-content-detail'
import type { AnalysisContentDetailViewModel, AnalysisViewModel, AnalysisWorkListViewModel } from '../types/analysis'

/** 开发预览数据适配层：仅在 DEV_UI_PREVIEW 打开时使用，不代表真实业务结果。 */
export function getAnalysisContentDetailPreview(): AnalysisContentDetailViewModel {
  return analysisContentDetailPreview
}

export function getAnalysisOverviewPreview(): AnalysisViewModel {
  return analysisOverviewPreview
}

export function getAnalysisWorkListPreview(): AnalysisWorkListViewModel {
  return {
    summary: analysisOverviewPreview.summary,
    cards: analysisOverviewPreview.cards,
    workCount: analysisOverviewPreview.workCount,
  }
}
