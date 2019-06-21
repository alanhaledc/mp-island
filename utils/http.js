import { Base64 } from 'js-base64'
import { Token } from '../models/token'
import { config } from '../config'

const tips = {
  1: '抱歉，出现了一个错误！'
}

class Http {
  request({ url, data = {}, method = 'GET' }) {
    return new Promise((resolve, reject) => {
      this._request(url, resolve, reject, data, method)
    })
  }

  _request(url, resolve, reject, data = {}, method = 'GET', noRefetch = false) {
    wx.request({
      url: config.api_base_url + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json',
        Authorization: this._encode()
      },
      success: res => {
        const code = res.statusCode.toString()
        if (code.startsWith('2')) {
          resolve(res.data)
        } else {
          if (code === '403') {
            if (!noRefetch) {
              this._refresh(url, resolve, reject, data, method)
            }
          } else {
            reject()
            const error_code = res.data.error_code
            this._show_error(error_code)
          }
        }
      },
      fail: err => {
        reject()
        this._show_error(1)
      }
    })
  }

  _show_error(error_code = 1) {
    const tip = tips[error_code]
    return wx.showToast({
      title: tip ? tip : tips['1'],
      icon: 'none',
      duration: 2000
    })
  }

  _encode() {
    const token = wx.getStorageSync('token')
    const result = Base64.encode(token + ':')
    return 'Basic ' + result
  }

  _refresh(...param) {
    const token = new Token()
    token.getTokenFromServer(token => {
      this._request(...param, true)
    })
  }
}

export { Http }
