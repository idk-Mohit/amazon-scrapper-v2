const fixText = require("./fixtext");

const {
  get_about_this_product,
  get_image_from_product,
  get_prices_from_product,
  get_review_from_product,
  get_stock_info_from_product,
} = require("./utils");

async function product(query) {
  console.log("query", query);
  const product_page = await (
    await fetch(`https://www.amazon.in/${query}`)
  ).text();

  const features = get_about_this_product(product_page);
  const image = get_image_from_product(product_page);
  const rating_details = get_review_from_product(product_page);
  const in_stock = get_stock_info_from_product(product_page);
  const { price, original_price } = get_prices_from_product(product_page);

  try {
    var product_detail = {
      name: fixText(
        product_page
          .split(
            '<span id="productTitle" class="a-size-large product-title-word-break">'
          )[1]
          .split("</span>")[0]
      ),
      image,
      price,
      original_price,
      in_stock,
      rating_details,
      features,
      product_link: `https://www.amazon.in/${query}`,
    };
  } catch (err) {
    var product_detail = null;
  }

  return JSON.stringify(
    {
      status: true,
      query,
      fetch_from: `https://www.amazon.in/${query}`,
      product_detail,
    },
    null,
    2
  );
}

module.exports = product;
