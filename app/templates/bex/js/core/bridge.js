/**
 * THIS FILE WILL BE OVERWRITTEN.
 * DO NOT EDIT.
 **/

import { EventEmitter } from 'events'

const
  typeSizes = {
    'undefined': () => 0,
    'boolean': () => 4,
    'number': () => 8,
    'string': item => 2 * item.length,
    'object': item => !item ? 0 : Object
    .keys(item)
    .reduce((total, key) => sizeOf(key) + sizeOf(item[key]) + total, 0)
  },
  sizeOf = value => typeSizes[typeof value](value)

export default class Bridge extends EventEmitter {
  constructor (wall) {
    super()
    this.setMaxListeners(Infinity)
    this.wall = wall
    wall.listen(messages => {
      if (Array.isArray(messages)) {
        messages.forEach(message => this._emit(message))
      } else {
        this._emit(messages)
      }
    })

    this._sendingQueue = []
    this._receivingQueue = []
    this._sending = false
    this._maxMessageSize = 32 * 1024 * 1024 // 32mb
  }

  /**
   * Send an event.
   *
   * @param event
   * @param payload
   * @returns Promise<>
   */
  send (event, payload) {
    return this._send([{ event, payload }])
  }

  _emit (message) {
    if (typeof message === 'string') {
      this.emit(message)
    } else if (message._chunk) {
      this._receivingQueue.push(message._chunk)
      if (message.last) {
        this.emit(message.event, this._receivingQueue)
        this._receivingQueue = []
      }
    } else {
      this.emit(message.event, message.payload)
    }
  }

  _send (messages) {
    this._sendingQueue.push(messages)
    return this._nextSend()
  }

  _nextSend () {
    if (!this._sendingQueue.length || this._sending) return Promise.resolve()
    this._sending = true

    const
      messages = this._sendingQueue.shift(),
      currentMessage = messages[0]

    return new Promise((resolve, reject) => {
      let allChunks = []

      const fn = (r) => {
        // If this is a split message then keep listening for the chunks and build a list to resolve
        if (r !== void 0 && r._chunkSplit) {
          const chunkData = r._chunkSplit
          allChunks = [...allChunks, ...r.data]

          // Last chunk received so resolve the promise.
          if (chunkData.lastChunk) {
            this.off(currentMessage.event + '.result', fn)
            resolve(allChunks)
          }
        } else {
          this.off(currentMessage.event + '.result', fn)
          resolve(r)
        }
      }

      this.on(currentMessage.event + '.result', fn)

      try {
        this.wall.send(messages)
      } catch (err) {
        const errorMessage = 'Message length exceeded maximum allowed length.'

        if (err.message === errorMessage) {
          // If the payload is an array and too big then split it into chunks and send to the clients bridge
          // the client bridge will then resolve the promise.
          if (!Array.isArray(currentMessage.payload)) {
            if (process.env.NODE_ENV !== 'production') {
              console.error(errorMessage + ' Note: The bridge can deal with this is if the payload is an Array.')
            }
          } else {
            const objectSize = sizeOf(currentMessage)

            if (objectSize > this._maxMessageSize) {
              const
                chunksRequired = Math.ceil(objectSize / this._maxMessageSize),
                arrayItemCount = Math.ceil(currentMessage.payload.length / chunksRequired)

              let data = currentMessage.payload
              for (let i = 0; i < chunksRequired; i++) {
                let take = Math.min(data.length, arrayItemCount)

                this.wall.send([{
                  event: currentMessage.event,
                  payload: {
                    _chunkSplit: {
                      count: chunksRequired,
                      lastChunk: i === chunksRequired - 1
                    },
                    data: data.splice(0, take)
                  }
                }])
              }
            }
          }
        }
      }
      this._sending = false
      requestAnimationFrame(() => { return this._nextSend() })
    })
  }
}
