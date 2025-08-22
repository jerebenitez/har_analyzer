export interface HARData {
  log: {
    entries: Array<{
      request: {
        method: string
        url: string
        headers: Array<{ name: string; value: string }>
        cookies: Array<{ name: string; value: string }>
        queryString: Array<{ name: string; value: string }>
        postData?: {
          mimeType: string
          text: string
        }
      }
      response: {
        status: number
        statusText: string
        headers: Array<{ name: string; value: string }>
        cookies: Array<{ name: string; value: string }>
        content: {
          size: number
          mimeType: string
          text?: string
        }
      }
      startedDateTime: string
      time: number
    }>
  }
}
