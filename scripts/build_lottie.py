"""
Génère public/lottie/komerce-hero.json : une animation Lottie (vectorielle, format
bodymovin) écrite à la main — pas une vidéo générée par IA. Formes géométriques
simples (panier, boîtes, pièce, graphique, étincelles) en vert/or KOMERCE, plus
le vrai logo (logo-mark.png) en image, agrandi et non obstrué au centre.
"""
import json
import math

W = H = 600
CX, CY = 300, 300
FPS = 30
DURATION = 150  # 5 s

GREEN_900 = [0.016, 0.227, 0.125, 1]   # #043a20
GREEN_700 = [0.031, 0.373, 0.204, 1]   # #085f34
GREEN_600 = [0.043, 0.478, 0.263, 1]   # #0b7a42
GREEN_500 = [0.071, 0.576, 0.310, 1]   # #12934f
GOLD_400 = [0.851, 0.655, 0.173, 1]    # #d9a72c
GOLD_300 = [0.941, 0.824, 0.498, 1]    # #f0d27f
WHITE = [1, 1, 1, 1]

EASE = {"i": {"x": [0.42], "y": [1]}, "o": {"x": [0.58], "y": [0]}}


def kf(pairs):
    """pairs: [(t, value), ...] -> propriété animée avec interpolation douce (ease in/out)."""
    out = []
    for idx, (t, v) in enumerate(pairs):
        item = {"t": t, "s": v if isinstance(v, list) else [v]}
        if idx < len(pairs) - 1:
            item.update(EASE)
        out.append(item)
    return {"a": 1, "k": out}


def static(v):
    # v est utilisé tel quel : nombre pour une valeur simple (opacité, rotation…),
    # liste pour une valeur multidimensionnelle (position, échelle, couleur…),
    # objet pour des données de tracé ("sh").
    return {"a": 0, "k": v}


def transform(pos=(0, 0), anchor=(0, 0), scale=(100, 100), rotation=0, opacity=100):
    return {
        "ty": "tr",
        "p": pos if isinstance(pos, dict) else static(list(pos)),
        "a": anchor if isinstance(anchor, dict) else static(list(anchor)),
        "s": scale if isinstance(scale, dict) else static(list(scale)),
        "r": rotation if isinstance(rotation, dict) else static(rotation),
        "o": opacity if isinstance(opacity, dict) else static(opacity),
        "sk": static(0), "sa": static(0),
    }


def fill(color, opacity=100):
    return {"ty": "fl", "c": static(color[:3]), "o": static(opacity), "r": 1}


def stroke(color, width, opacity=100):
    return {"ty": "st", "c": static(color[:3]), "o": static(opacity), "w": static(width), "lc": 2, "lj": 2}


_gid = [0]


def group(name, items, pos=(0, 0), anchor=(0, 0), scale=(100, 100), rotation=0, opacity=100):
    _gid[0] += 1
    return {"ty": "gr", "nm": name, "it": items + [transform(pos, anchor, scale, rotation, opacity)]}


def rect(size, pos, radius=0):
    return {"ty": "rc", "s": static(list(size)), "p": static(list(pos)), "r": static(radius)}


def ellipse(size, pos):
    return {"ty": "el", "s": static(list(size)), "p": static(list(pos))}


def star_path(cx, cy, outer, inner, points=4, rotation_deg=0):
    """Étoile à N pointes, arêtes droites (pas de courbure)."""
    verts = []
    for i in range(points * 2):
        r = outer if i % 2 == 0 else inner
        a = math.radians(rotation_deg) + i * math.pi / points
        verts.append([cx + r * math.sin(a), cy - r * math.cos(a)])
    zero = [0, 0]
    return {"ty": "sh", "ks": static({"c": True, "v": verts, "i": [zero] * len(verts), "o": [zero] * len(verts)})}


def shape_layer(name, ind, shapes, pos_kf=None, pos_static=(0, 0), scale_kf=None, scale_static=(100, 100),
                 opacity_kf=None, opacity_static=100, rotation_kf=None, rotation_static=0, anchor=(0, 0)):
    ks = {
        "o": opacity_kf or static(opacity_static),
        "r": rotation_kf or static(rotation_static),
        "p": pos_kf or static(list(pos_static)),
        "a": static(list(anchor)),
        "s": scale_kf or static(list(scale_static)),
    }
    return {
        "ddd": 0, "ind": ind, "ty": 4, "nm": name, "sr": 1,
        "ks": ks, "ao": 0, "shapes": shapes, "ip": 0, "op": DURATION, "st": 0, "bm": 0,
    }


def image_layer(name, ind, asset_id, pos_kf=None, pos_static=(0, 0), scale_kf=None, scale_static=(100, 100),
                 opacity_kf=None, opacity_static=100, anchor=(0, 0)):
    return {
        "ddd": 0, "ind": ind, "ty": 2, "nm": name, "refId": asset_id, "sr": 1,
        "ks": {
            "o": opacity_kf or static(opacity_static),
            "r": static(0),
            "p": pos_kf or static(list(pos_static)),
            "a": static(list(anchor)),
            "s": scale_kf or static(list(scale_static)),
        },
        "ao": 0, "ip": 0, "op": DURATION, "st": 0, "bm": 0,
    }


layers = []
ind = 1

# ---------- Graphique de croissance (haut-droite) : 4 barres qui montent en escalier ----------
bars = [
    {"x": 430, "h": 60, "start": 46, "end": 78},
    {"x": 466, "h": 95, "start": 54, "end": 86},
    {"x": 502, "h": 130, "start": 62, "end": 94},
    {"x": 538, "h": 170, "start": 70, "end": 102},
]
bar_w = 26
baseline = 470
bar_items = []
for i, b in enumerate(bars):
    top = baseline - b["h"]
    cx_bar = b["x"] + bar_w / 2
    color = GREEN_500 if i % 2 == 0 else GREEN_600
    r = rect((bar_w, b["h"]), (cx_bar, top + b["h"] / 2), 8)
    grp = group(f"bar{i}", [r, fill(color)], pos=(cx_bar, baseline), anchor=(cx_bar, baseline))
    bar_items.append(grp)

layers.append(shape_layer(
    "Graphique", ind, bar_items,
    scale_kf={"a": 1, "k": [
        {"t": 40, "s": [100, 0], **EASE}, {"t": 78, "s": [100, 108], **EASE}, {"t": 90, "s": [100, 100]},
    ]},
    # ancre = point au sol (baseline) ; position = même point à l'écran -> la croissance part bien du sol.
    pos_static=(0, baseline), anchor=(0, baseline),
))
ind += 1

# petit socle discret sous le graphique
layers.append(shape_layer(
    "Socle graphique", ind,
    [group("socle", [rect((176, 5), (516, baseline + 4), 3), fill(GOLD_400, 55)])],
    opacity_kf=kf([(40, 0), (55, 70)]),
))
ind += 1

# ---------- Étincelles (coins, discrètes) ----------
sparkle_defs = [
    {"p": (72, 108), "s": 11, "start": 96, "peak": 108, "end": 150},
    {"p": (528, 82), "s": 9, "start": 104, "peak": 116, "end": 150},
    {"p": (552, 512), "s": 10, "start": 112, "peak": 124, "end": 150},
    {"p": (78, 536), "s": 8, "start": 120, "peak": 132, "end": 150},
]
for i, sp in enumerate(sparkle_defs):
    path = star_path(0, 0, sp["s"], sp["s"] * 0.38, points=4)
    grp = group("étoile", [path, fill(GOLD_300)], pos=(0, 0))
    layers.append(shape_layer(
        f"Étincelle {i+1}", ind, [grp],
        pos_static=sp["p"],
        opacity_kf={"a": 1, "k": [
            {"t": sp["start"], "s": [0], **EASE}, {"t": sp["peak"], "s": [95], **EASE},
            {"t": sp["peak"] + 14, "s": [25], **EASE}, {"t": sp["end"], "s": [70]},
        ]},
        scale_kf={"a": 1, "k": [
            {"t": sp["start"], "s": [40, 40], **EASE}, {"t": sp["peak"], "s": [115, 115], **EASE}, {"t": sp["peak"] + 14, "s": [90, 90]},
        ]},
        rotation_kf={"a": 1, "k": [{"t": sp["start"], "s": [0]}, {"t": DURATION, "s": [40]}]},
    ))
    ind += 1

# ---------- Pièce (bas-droite) ----------
coin_items = [
    group("anneau", [ellipse((66, 66), (0, 0)), fill(GOLD_400)]),
    group("centre", [ellipse((46, 46), (0, 0)), fill(GOLD_300)]),
    group("reflet", [ellipse((16, 10), (-10, -14)), fill(WHITE, 55)]),
]
layers.append(shape_layer(
    "Pièce", ind, coin_items,
    pos_static=(478, 434),
    scale_kf={"a": 1, "k": [
        {"t": 58, "s": [0, 0], **EASE}, {"t": 74, "s": [112, 112], **EASE}, {"t": 84, "s": [100, 100]},
    ]},
    opacity_kf=kf([(58, 0), (66, 100)]),
    rotation_kf={"a": 1, "k": [
        {"t": 84, "s": [-8], **EASE}, {"t": 118, "s": [8], **EASE}, {"t": DURATION, "s": [-8]},
    ]},
))
ind += 1

# ---------- Boîtes produits (au-dessus du panier), 3 boîtes, entrée avec rebond ----------
box_defs = [
    {"pos": (78, 336), "size": 46, "start": 30, "color": GREEN_600},
    {"pos": (128, 322), "size": 52, "start": 40, "color": GREEN_500},
    {"pos": (176, 340), "size": 42, "start": 50, "color": GREEN_700},
]
for i, b in enumerate(box_defs):
    s = b["size"]
    body = rect((s, s), (0, 0), 9)
    ribbon_v = rect((6, s), (0, 0), 3)
    ribbon_h = rect((s, 6), (0, 0), 3)
    items = [
        group("corps", [body, fill(b["color"])]),
        group("ruban-v", [ribbon_v, fill(GOLD_400)]),
        group("ruban-h", [ribbon_h, fill(GOLD_400)]),
    ]
    start = b["start"]
    float_amp = 5
    layers.append(shape_layer(
        f"Boîte {i+1}", ind, items,
        pos_kf={"a": 1, "k": [
            {"t": start, "s": [b["pos"][0], b["pos"][1] - 30]}, {"t": start + 14, "s": [b["pos"][0], b["pos"][1]], **EASE},
            {"t": start + 40, "s": [b["pos"][0], b["pos"][1] - float_amp], **EASE},
            {"t": start + 70, "s": [b["pos"][0], b["pos"][1] + float_amp], **EASE},
            {"t": DURATION, "s": [b["pos"][0], b["pos"][1] - float_amp]},
        ]},
        scale_kf={"a": 1, "k": [
            {"t": start, "s": [30, 30], **EASE}, {"t": start + 12, "s": [112, 112], **EASE}, {"t": start + 20, "s": [100, 100]},
        ]},
        opacity_kf=kf([(start, 0), (start + 10, 100)]),
        rotation_kf={"a": 1, "k": [{"t": start, "s": [-14]}, {"t": start + 20, "s": [0]}]},
    ))
    ind += 1

# ---------- Panier (bas-gauche), glisse depuis la gauche ----------
cart_items = [
    group("roue-g", [ellipse((20, 20), (0, 0)), fill(GREEN_900)], pos=(-36, 66)),
    group("roue-d", [ellipse((20, 20), (0, 0)), fill(GREEN_900)], pos=(36, 66)),
    group("poignee", [rect((78, 11), (0, 0), 6), fill(GOLD_400)], pos=(-46, -46), rotation=-38),
    group("corps", [rect((150, 74), (0, 0), 18), fill(GREEN_700)], pos=(0, 24)),
    group("rebord", [rect((160, 15), (0, 0), 7), fill(GOLD_400)], pos=(0, -16)),
    group("reflet", [rect((120, 10), (0, 0), 5), fill(WHITE, 12)], pos=(0, 4)),
]
layers.append(shape_layer(
    "Panier", ind, cart_items,
    pos_kf={"a": 1, "k": [
        {"t": 6, "s": [-70, 468]}, {"t": 34, "s": [118, 468], **EASE},
        {"t": 60, "s": [118, 464], **EASE}, {"t": 90, "s": [118, 470], **EASE}, {"t": DURATION, "s": [118, 464]},
    ]},
    opacity_kf=kf([(6, 0), (18, 100)]),
    rotation_kf={"a": 1, "k": [{"t": 6, "s": [-6]}, {"t": 34, "s": [0]}]},
))
ind += 1

# ---------- Halo doux derrière le logo (profondeur subtile) ----------
# L'ellipse est dessinée à l'origine locale (0,0) ; l'ancre du calque coïncide avec cette
# origine et la position place cette même origine à l'écran (CX,CY) : le halo pulse sur place.
layers.append(shape_layer(
    "Halo", ind,
    [group("halo", [ellipse((300, 300), (0, 0)), fill(GREEN_500, 16)])],
    pos_static=(CX, CY), anchor=(0, 0),
    scale_kf={"a": 1, "k": [
        {"t": 0, "s": [80, 80], **EASE}, {"t": 75, "s": [104, 104], **EASE}, {"t": DURATION, "s": [80, 80]},
    ]},
    opacity_kf=kf([(0, 0), (20, 100)]),
))
ind += 1

# ---------- Logo KOMERCE (image réelle, agrandi, au centre, jamais obstrué) ----------
LOGO_SIZE = 232  # diamètre visuel rendu (agrandi, net, bien identifiable)
scale_target = LOGO_SIZE / 320 * 100  # asset source 320x320
scale_start = scale_target * 0.95
layers.append(image_layer(
    "Logo KOMERCE", ind, "image_0",
    pos_static=(CX, CY), anchor=(160, 160),
    scale_kf={"a": 1, "k": [
        {"t": 0, "s": [scale_start, scale_start], **EASE},
        {"t": 22, "s": [scale_target, scale_target], **EASE},
        {"t": 75, "s": [scale_target * 1.015, scale_target * 1.015], **EASE},
        {"t": DURATION, "s": [scale_target, scale_target]},
    ]},
    opacity_kf=kf([(0, 0), (18, 100)]),
))
ind += 1

# ---------- Fondu d'ouverture/fermeture global (boucle sans coupure visible) ----------
FADE = 10
master = {
    "ddd": 0, "ind": ind, "ty": 0, "nm": "Scène", "refId": "comp_0", "sr": 1,
    "ks": {
        "o": {"a": 1, "k": [
            {"t": 0, "s": [0], **EASE}, {"t": FADE, "s": [100], **EASE},
            {"t": DURATION - FADE, "s": [100], **EASE}, {"t": DURATION, "s": [0]},
        ]},
        "r": static(0), "p": static([0, 0]), "a": static([0, 0]), "s": static([100, 100]),
    },
    "ao": 0, "w": W, "h": H, "ip": 0, "op": DURATION, "st": 0, "bm": 0,
}

lottie = {
    "v": "5.9.6", "fr": FPS, "ip": 0, "op": DURATION, "w": W, "h": H,
    "nm": "KOMERCE Hero", "ddd": 0, "assets": [
        # p sans slash initial : combiné à assetsPath="/" (passé à loadAnimation), donne "/logo-mark.png".
        {"id": "image_0", "w": 320, "h": 320, "u": "", "p": "logo-mark.png", "e": 0},
        {"id": "comp_0", "layers": layers, "fr": FPS},
    ],
    "layers": [master], "markers": [],
}

out_path = "public/lottie/komerce-hero.json"
import os
os.makedirs(os.path.dirname(out_path), exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(lottie, f, ensure_ascii=False, separators=(",", ":"))

print("layers:", len(layers), "-> écrit dans", out_path)
print("taille:", os.path.getsize(out_path), "octets")
