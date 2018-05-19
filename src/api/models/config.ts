export interface EditableConfig {
  /**
   * @minimum 0
   */
  sigma: number,
  /**
   * @minimum 0
   */
  depth: number,
  saveObjImages: boolean,
  saveNgcImages: boolean,
  /**
   * @minimum 0.1
   */
  imageScale: number
}