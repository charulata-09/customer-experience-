export const sendSuccess = (res, data, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (res, code, message, statusCode = 400, details = null) => {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };
  if (details !== null && details !== undefined) {
    payload.error.details = details;
  }
  return res.status(statusCode).json(payload);
};
