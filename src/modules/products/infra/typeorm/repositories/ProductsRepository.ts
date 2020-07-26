import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);

    const allProducts = await this.ormRepository.findByIds(productsIds);
    // const allProducts = await this.ormRepository.find({id: In(productsIds) });

    if (allProducts.length !== productsIds.length) {
      throw new AppError('Found products do not match.');
    }

    return allProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsFound = await this.findAllById(products);

    const productsUpdated = productsFound.map(product => {
      const productRelated = products.find(
        productRelatedSearch => productRelatedSearch.id === product.id,
      );

      if (!productRelated) {
        throw new AppError('Product not found.');
      }

      if (product.quantity < productRelated.quantity) {
        throw new AppError('Insufficient product quantity.');
      }

      const newProduct = product;

      newProduct.quantity -= productRelated.quantity;

      return newProduct;
    });

    await this.ormRepository.save(productsUpdated);

    return productsUpdated;
  }
}

export default ProductsRepository;
