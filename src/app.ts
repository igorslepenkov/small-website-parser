import express from "express";
import puppeteer from "puppeteer";
import path from "path";

const PORT = 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.status(200).render("parser");
});

app.post("/parse", async (req, res) => {
  const { url } = req.body;
  if (url) {
    console.log("Started");
    const browser = await puppeteer.launch({
      headless: false,
    });
    console.log("Browser launched");
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
    );
    console.log("Page Created");

    await page.goto(url, { timeout: 0 });
    console.log("Navigated to url");

    await page.waitForSelector(".palette-product-card", { timeout: 0 });
    console.log("Find selectors");

    const pageTitle = await page.$eval(
      "h1.listing-top-head__text",
      (heading) => heading.textContent
    );

    const products = await page.$$(".palette-product-card");

    const productsObjects = await Promise.all(
      products.map(async (product) => {
        const title = await product.$eval(
          "span.palette-product-card-description__title-row",
          (span) => span.textContent
        );
        const image = await product.$eval("img.palette-image", (img) => {
          return {
            src: img.getAttribute("src"),
            srcSet: img.getAttribute("srcset"),
          };
        });
        const price = await product.$eval(
          "span.palette-product-card-price__price-tag",
          (span) => span.textContent
        );

        const link = await product.$eval(
          "a.palette-product-card-main-image__link",
          (link) => link.getAttribute("href")
        );

        return {
          title,
          image,
          price,
          link: "https://www.booztlet.com" + link,
        };
      })
    );

    res
      .status(200)
      .render("products", { title: pageTitle, products: productsObjects });
  }
});

app.listen(PORT, () => {
  console.log("App is listening on port 3000");
});
