import lib_axios from "./axios";

export default class lib_heartbeat {
  public static async ping(id: string, status: string, message: string) {
    return lib_axios.request({
      method: "GET",
      url: `/${id}?status=${status}&msg=${message}&ping=`,
      baseURL: process.env.MONITOR_API,
    });
  }
}
