"""Fuller clown silhouette; share the same deformation across face and suit."""
import numpy as np


def round_points(points):
    p = np.asarray(points, dtype=float)
    y = p[:, 1]
    belly = np.exp(-((y - .76) / .245) ** 4)
    head = np.exp(-((y - 1.34) / .34) ** 4)
    q = p.copy()
    q[:, 0] *= 1 + .13 * belly + .08 * head
    q[:, 2] = .025 + (p[:, 2] - .025) * (1 + .23 * belly + .18 * head)
    return q


def round_mesh(points, normals):
    p = np.asarray(points, dtype=float)
    # Transform normals with the inverse transpose of the smooth warp Jacobian.
    step = 1e-5
    jacobian = np.stack([
        (round_points(p + np.eye(3)[axis] * step) -
         round_points(p - np.eye(3)[axis] * step)) / (2 * step)
        for axis in range(3)
    ], axis=2)
    n = np.linalg.solve(jacobian.transpose(0, 2, 1), np.asarray(normals)[..., None])[..., 0]
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    return round_points(p).astype('<f4'), n.astype('<f4')


def join_head_mesh(points, normals):
    """Continue the rear underside into the collar, preserving the front face."""
    def bend(p):
        q = p.copy()
        rear = np.clip((.015 - p[:, 2]) / .20, 0, 1)
        rear = rear * rear * (3 - 2 * rear)
        lower = np.exp(-((p[:, 1] - 1.115) / .135) ** 4)
        q[:, 1] -= .145 * rear * lower
        return q
    p = np.asarray(points, dtype=float)
    step = 1e-5
    jacobian = np.stack([
        (bend(p + np.eye(3)[axis] * step) - bend(p - np.eye(3)[axis] * step)) / (2 * step)
        for axis in range(3)
    ], axis=2)
    n = np.linalg.solve(jacobian.transpose(0, 2, 1), np.asarray(normals)[..., None])[..., 0]
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-12)
    return bend(p).astype('<f4'), n.astype('<f4')
