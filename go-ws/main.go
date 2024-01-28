package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"golang.org/x/net/websocket"
)

type Drawing struct {
	X           int    `json:"x"`
	Y           int    `json:"y"`
	LineWidth   int    `json:"lineWidth"`
	StrokeStyle string `json:"strokeStyle"`
}

type Content struct {
	Id     string  `json:"id"`
	RoomId string  `json:"room_id"`
	Data   Drawing `json:"data,omitempty"`
}

type Message struct {
	Message_type string  `json:"message_type"`
	Content      Content `json:"content"`
}

type Server struct {
	conns  map[string]*websocket.Conn
	rooms  map[string]Drawing
	groups map[string][]string
}

func newServer() *Server {
	return &Server{
		// id:Websocket
		conns: make(map[string]*websocket.Conn),
		// RoomID:[]Drawings
		rooms: make(map[string]Drawing),
		// RoomID:id
		groups: make(map[string][]string),
	}
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]
	roomID := vars["room_id"]

	if _, ok := s.groups[roomID]; ok {
		s.groups[roomID] = append(s.groups[roomID], id)
	} else {
		s.groups[roomID] = []string{id}
	}
	if _, ok := s.rooms[roomID]; !ok {
		// If not, add the key with an empty slice of Drawing
		s.rooms[roomID] = Drawing{}
		fmt.Println("Added room:", roomID, "with empty drawing array")
	}

	fmt.Println("new connection from: ", r.RemoteAddr)
	fmt.Println("ID:", id)
	fmt.Println("Room ID:", roomID)

	// WebSocket handling
	ws := websocket.Handler(func(conn *websocket.Conn) {
		s.handleWebSocket(conn, id)
	})
	ws.ServeHTTP(w, r)
}

func (s *Server) handleWebSocket(ws *websocket.Conn, id string) {
	s.conns[id] = ws
	s.readLoop(ws)
}

func filterValue(arr []string, valueToRemove string) []string {
	var result []string

	for _, v := range arr {
		if v != valueToRemove {
			result = append(result, v)
		}
	}

	return result
}

func (s *Server) readLoop(ws *websocket.Conn) {
	for {
		var receivedMessage Message

		// Read from the WebSocket connection
		err := websocket.JSON.Receive(ws, &receivedMessage)
		if err != nil {
			fmt.Println("Error reading from WebSocket:", err)
			break
		}

		switch receivedMessage.Message_type {
		case "join":
			var joinContent Content
			joinContent = receivedMessage.Content
			// Handle join event...
			s.groups[joinContent.RoomId] = append(s.groups[joinContent.RoomId], joinContent.Id)

		case "drawing":
			var drawingContent Drawing
			drawingContent = receivedMessage.Content.Data

			// Handle drawing event...
			jsonData, err := json.Marshal(drawingContent)
			if err != nil {
				fmt.Println("Error marshalling Drawing array to JSON: ", err)
				return
			}
			for _, con := range s.conns {
				con.Write(jsonData)
			}

		case "close", "leave":
			var cont Content
			cont = receivedMessage.Content
			// Handle close or leave event...
			s.groups[cont.RoomId] = filterValue(s.groups[cont.RoomId], cont.Id)

		default:
			fmt.Println("INVALID MESSAGE", receivedMessage)
		}
	}
}

func main() {
	r := mux.NewRouter()
	server := newServer()

	// Define a route with path variables for 'id' and 'room_id'
	r.Handle("/ws/{id}/{room_id}", http.HandlerFunc(server.handleWS))

	http.Handle("/", r)
	http.ListenAndServe(":3000", nil)
}
