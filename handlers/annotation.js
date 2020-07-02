const { v4: uuid } = require('uuid')
const Boom = require('@hapi/boom')
const db = require('../db')
const { Container, wrapResource, expandAnnotation } = require('../ldp')

async function createAnnotation (request, h) {
  const collectionKey = `${request.params.user}/${request.params.collection}`
  try {
    await db.get(collectionKey)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
  if (!request.payload) {
    return Boom.badRequest()
  }

  const id = uuid()
  const annotationKey = `${collectionKey}/${id}`
  const annotation = request.payload
  annotation.id = id

  try {
    await db.get(annotationKey)
    return Boom.badRequest()
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }

    await db.put(annotationKey, annotation)

    const containerInfo = new Container(collectionKey)
    const resource = wrapResource(
      h,
      expandAnnotation(annotation, containerInfo)
    )
    return h
      .response(resource)
      .code(201)
      .header('location', `/${annotationKey}`)
  }
}

async function getAnnotation (request, h) {
  const collectionKey = `${request.params.user}/${request.params.collection}`
  try {
    await db.get(collectionKey)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }

  const annotationKey = `${collectionKey}/${request.params.annotation}`
  try {
    const annotation = await db.get(annotationKey)
    const containerInfo = new Container(collectionKey)
    return wrapResource(h, expandAnnotation(annotation, containerInfo))
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

async function deleteAnnotation (request, h) {
  const collectionKey = `${request.params.user}/${request.params.collection}`
  try {
    await db.get(collectionKey)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }

  const annotationKey = `${collectionKey}/${request.params.annotation}`
  try {
    await db.get(annotationKey)
    await db.del(annotationKey)
    return h.response().code(204)
  } catch (err) {
    if (!err.notFound) {
      console.error(request.method, request.path, err)
      return Boom.internal()
    }
    return Boom.notFound()
  }
}

module.exports = { createAnnotation, getAnnotation, deleteAnnotation }
