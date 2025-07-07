"use client"

import type React from "react"

import { createContext, useContext, useEffect, useRef, useState } from "react"

interface WebSocketContextType {
  socket: WebSocket | null
  isConnected: boolean
  sendMessage: (message: any) => void
  lastMessage: any
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  sendMessage: () => {},
  lastMessage: null,
})

export function useWebSocket() {
  return useContext(WebSocketContext)
}

interface WebSocketProviderProps {
  children: React.ReactNode
  url?: string
}

export function WebSocketProvider({ children, url }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3

  const connect = () => {
    try {
      // Use mock WebSocket for demo purposes
      const mockSocket = {
        readyState: 1, // OPEN
        send: (data: string) => {
          console.log("Mock WebSocket send:", data)
          // Simulate receiving a response
          setTimeout(() => {
            setLastMessage({ type: "pong", timestamp: Date.now() })
          }, 100)
        },
        close: () => {
          setIsConnected(false)
          setSocket(null)
        },
        addEventListener: () => {},
        removeEventListener: () => {},
      } as unknown as WebSocket

      setSocket(mockSocket)
      setIsConnected(true)
      reconnectAttempts.current = 0

      console.log("Mock WebSocket connected")
    } catch (error) {
      console.error("WebSocket connection failed:", error)
      handleReconnect()
    }
  }

  const handleReconnect = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++
      console.log(`Attempting to reconnect... (${reconnectAttempts.current}/${maxReconnectAttempts})`)

      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, 2000 * reconnectAttempts.current)
    } else {
      console.log("Max reconnection attempts reached")
    }
  }

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message))
    } else {
      console.warn("WebSocket not connected, cannot send message:", message)
    }
  }

  useEffect(() => {
    // Auto-connect on mount
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (socket) {
        socket.close()
      }
    }
  }, [])

  const value = {
    socket,
    isConnected,
    sendMessage,
    lastMessage,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}
