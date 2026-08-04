const generateSlug = async (name, Model, excludeID = null) => {
  let slug = name.toLowerCase().trim().replaceAll(" ", "-");

  const generateRandom = () => {
    const min = 1000,
      max = 9999;
    return Math.floor(min + Math.random() * (max - min + 1));
  };

  let existingSlug = await Model.findOne({
    slug,
    ...(excludeID && { _id: { $ne: excludeID } }),
  });

  while (existingSlug) {
    slug = `${name
      .toLowerCase()
      .trim()
      .replaceAll(" ", "-")}-${generateRandom()}`;

    existingSlug = await Model.findOne({
      slug,
      ...(excludeID && { _id: { $ne: excludeID } }),
    });
  }

  return slug;
};

module.exports = generateSlug;
