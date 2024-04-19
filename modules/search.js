const {
  extractImageUrl,
  extractOriginalPrice,
  extractPrice,
  extractProductName,
} = require("./utils");

async function searchProducts(query, host) {
  const searchQuery = query.replace(/%20/gi, "+");
  const searchRes = await (
    await fetch(`https://www.amazon.in/s?k=${searchQuery}`)
  ).text();

  var all_product = searchRes.split(
    /<div cel_widget_id="MAIN-SEARCH_RESULTS[^"]*"/
  );

  var i,
    result = [];
  for (i = 1; i < all_product.length; i++) {
    //   /* (type 1) */
    try {
      var product_link =
        "http://www.amazon.in" +
        all_product[i]
          .split(
            '<a class="a-link-normal s-no-outline" target="_blank" href="'
          )[1]
          .split('"')[0];

      if (product_link.includes("?")) {
        product_link = product_link.split("?")[0];
      }
      if (!/\/gp\/slredirect\/|sspa\/click/.test(product_link)) {
        /* Not including sponsered products */
        result.push({
          name: extractProductName(all_product[i]),
          image: extractImageUrl(all_product[i]),
          price: extractPrice(all_product, i),
          original_price: extractOriginalPrice(all_product[i]),
          product_link,
          query_url: product_link.replace("www.amazon.in", host + "/product"),
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  return JSON.stringify(
    {
      status: true,
      total_result: result.length,
      query: searchQuery,
      fetch_from: `https://www.amazon.in/s?k=${searchQuery}`,
      result,
    },
    null,
    2
  );
}

module.exports = searchProducts;
