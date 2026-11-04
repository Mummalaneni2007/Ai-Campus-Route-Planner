from flask import Flask, jsonify, request, send_from_directory
import networkx as nx

app = Flask(__name__)
G = nx.Graph()

# Campus locations
locations = [
    "main",
    "visvesvaraya",
    "pharmacy",
    "playground",
    "tennis",
    "ublock",
    "caffe",
    "meat"
]

G.add_nodes_from(locations)

# DEMO connections and approximate distances in metres.
# Replace these with verified campus walking connections.
paths = [
    ("main", "visvesvaraya", 90),
    ("main", "ublock", 110),
    ("main", "meat", 130),
    ("visvesvaraya", "playground", 100),
    ("visvesvaraya", "tennis", 120),
    ("playground", "tennis", 70),
    ("playground", "caffe", 150),
    ("tennis", "caffe", 180),
    ("ublock", "caffe", 80),
    ("ublock", "pharmacy", 140),
    ("pharmacy", "meat", 100)
]

G.add_weighted_edges_from(paths)


@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/style.css")
def css():
    return send_from_directory(".", "style.css")


@app.route("/script.js")
def js():
    return send_from_directory(".", "script.js")


@app.route("/api/route", methods=["POST"])
def find_route():

    data = request.get_json(silent=True) or {}

    start = data.get("start")
    end = data.get("end")

    if start not in G or end not in G:
        return jsonify({"error": "Invalid location"}), 400

    try:
        route = nx.shortest_path(
            G,
            source=start,
            target=end,
            weight="weight"
        )

        distance = nx.shortest_path_length(
            G,
            source=start,
            target=end,
            weight="weight"
        )

        walking_time = round(distance / 75)

        return jsonify({
            "route": route,
            "distance": distance,
            "walking_time": walking_time
        })

    except nx.NetworkXNoPath:
        return jsonify({"error": "No route found"}), 404


if __name__ == "__main__":
    app.run(debug=True)