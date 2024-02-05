package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	server := newServer()
	// Define a route with path variables for 'id' and 'room_id'
	r.Handle("/ws/{id}/{room_id}", http.HandlerFunc(server.handleWS))

	http.Handle("/", r)
	http.ListenAndServe(":3000", nil)
}
