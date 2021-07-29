function addRoute(route, rout1) {
  for (const key in route) {
    if (rout1[key]) {
      route[key] = {
        ...route[key],
        ...rout1[key]
      }
      delete rout1[key]
    }
  }
  for (const key in rout1) {
    route[key] = {
      ...rout1[key]
    }
  }
  return route
}
