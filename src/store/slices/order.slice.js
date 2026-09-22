import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  orders: [],
  cart: [],
  flag: { isLoading: false, error: null },
}

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrders(state, action) {
      state.orders = action.payload
    },
    setCart(state, action) {
      state.cart = action.payload
    },
    addToCart(state, action) {
      const { item, quantity = 1 } = action.payload
      const existing = state.cart.find((c) => c.itemId === item._id)
      if (existing) {
        existing.quantity += quantity
      } else {
        state.cart.push({
          itemId: item._id,
          itemName: item.name,
          volumeMl: item.volumeMl || 0,
          quantity,
          supplier: item.supplier || '',
        })
      }
    },
    removeFromCart(state, action) {
      state.cart = state.cart.filter((item) => item.itemId !== action.payload)
    },
    updateCartItem(state, action) {
      const { itemId, quantity } = action.payload
      state.cart = state.cart.map((item) =>
        item.itemId === itemId ? { ...item, quantity } : item
      )
    },
    clearCart(state) {
      state.cart = []
    },
    setIsLoading(state, action) {
      state.flag.isLoading = action.payload
    },
    setError(state, action) {
      state.flag.error = action.payload
    },
  },
})

export const {
  setOrders,
  setCart,
  addToCart,
  removeFromCart,
  updateCartItem,
  clearCart,
  setIsLoading,
  setError,
} = orderSlice.actions

export const orderReducer = orderSlice.reducer
