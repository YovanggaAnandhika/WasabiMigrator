import type { NextConfig } from "next";
import fs from "node:fs";

// Fix for Windows network drives (VirtioFS / Parallels / SMB drive Y:)
// where libuv/Windows returns EISDIR instead of EINVAL when calling readlink on normal files/folders
try {
  const patchError = (err: any, path: any) => {
    if (err && (err.code === "EISDIR" || err.code === "UNKNOWN" || err.message?.includes("EISDIR"))) {
      const einval: any = new Error(`EINVAL: invalid argument, readlink '${path}'`);
      einval.code = "EINVAL";
      einval.errno = -22;
      einval.syscall = "readlink";
      einval.path = path;
      return einval;
    }
    return err;
  };

  if (fs.readlink) {
    const origReadlink = fs.readlink.bind(fs);
    (fs as any).readlink = function (path: any, options: any, callback: any) {
      const cb = typeof options === "function" ? options : callback;
      const opts = typeof options === "function" ? undefined : options;
      origReadlink(path, opts, (err: any, linkString: any) => {
        if (err) {
          return cb(patchError(err, path));
        }
        cb(null, linkString);
      });
    };
  }

  if (fs.readlinkSync) {
    const origReadlinkSync = fs.readlinkSync.bind(fs);
    (fs as any).readlinkSync = function (path: any, options?: any) {
      try {
        return origReadlinkSync(path, options);
      } catch (err: any) {
        throw patchError(err, path);
      }
    };
  }

  if (fs.promises && fs.promises.readlink) {
    const origPromisesReadlink = fs.promises.readlink.bind(fs.promises);
    (fs.promises as any).readlink = async function (path: any, options?: any) {
      try {
        return await origPromisesReadlink(path, options);
      } catch (err: any) {
        throw patchError(err, path);
      }
    };
  }
} catch {
  // ignore
}

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      symlinks: false,
    };
    return config;
  },
};

export default nextConfig;
